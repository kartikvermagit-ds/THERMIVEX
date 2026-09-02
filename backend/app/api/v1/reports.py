import io
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import IncidentEvent
from app.services.ml_service import generate_shap_attributions

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dossier/{incident_id}/json")
def get_dossier_json(incident_id: str, db: Session = Depends(get_db)):
    """Returns structured tactical dossier for post-incident audit."""
    inc = db.query(IncidentEvent).filter(IncidentEvent.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    shap_factors = generate_shap_attributions(
        frp=inc.frp_total,
        delta_z=inc.frp_delta_zscore,
        dist_to_facility_m=inc.dist_to_facility_m,
        facility_name=inc.facility_name or "",
        daynight=inc.daynight,
        temp_diff=inc.temp_differential,
        predicted_class=inc.classification
    )

    return {
        "dossier_title": f"TACTICAL INCIDENT DOSSIER #{inc.id}",
        "incident_id": inc.id,
        "classification": inc.classification,
        "risk_score": inc.risk_score,
        "severity": inc.severity_label,
        "facility_name": inc.facility_name,
        "distance_to_boundary_m": inc.dist_to_facility_m,
        "telemetry": {
            "coordinates": [round(inc.longitude, 5), round(inc.latitude, 5)],
            "timestamp_utc": f"{inc.acq_date} {inc.acq_time} UTC",
            "satellite": inc.satellite,
            "daynight": inc.daynight,
            "frp_mw": inc.frp_total,
            "t4_kelvin": inc.bright_ti4_max,
            "t5_kelvin": inc.bright_ti5_min,
            "thermal_differential_kelvin": inc.temp_differential
        },
        "temporal_baseline": {
            "persistence_index": inc.persistence_index,
            "frp_delta_zscore": inc.frp_delta_zscore
        },
        "explainability": shap_factors
    }

@router.get("/dossier/{incident_id}/pdf")
def get_dossier_pdf(incident_id: str, db: Session = Depends(get_db)):
    """Generates and streams a tactical incident briefing PDF."""
    inc = db.query(IncidentEvent).filter(IncidentEvent.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A')
        )
        elements.append(Paragraph(f"THERMIVEX EMERGENCY INCIDENT DOSSIER #{inc.id}", title_style))
        elements.append(Spacer(1, 12))

        header_data = [
            ["Incident ID:", inc.id, "Classification:", inc.classification],
            ["Facility:", inc.facility_name or "Unknown", "Severity:", inc.severity_label],
            ["Risk Score:", f"{inc.risk_score} / 100", "Detection Time:", f"{inc.acq_date} {inc.acq_time} UTC"],
            ["Coordinates:", f"{inc.latitude:.4f}° N, {inc.longitude:.4f}° E", "Satellite:", f"{inc.satellite} ({inc.daynight})"],
            ["FRP (Power):", f"{inc.frp_total:.1f} MW", "Thermal Differential:", f"+{inc.temp_differential:.1f} K"],
            ["Anomaly Surge:", f"+{inc.frp_delta_zscore:.1f} Sigma", "Persistence Index:", f"{inc.persistence_index:.2f}"]
        ]
        t = Table(header_data, colWidths=[120, 150, 120, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1E293B')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 16))

        elements.append(Paragraph("RECOMMENDED EMERGENCY TACTICAL ACTIONS", styles['Heading2']))
        recs = [
            "1. Dispatch immediate foam tenders to indicated coordinates (Hazard Tier 5).",
            "2. Establish 800m security perimeter around primary storage tanks.",
            "3. Issue downwind toxic plume advisory for residential sectors in East-Southeast corridor.",
            "4. Alert State Disaster Management Authority (SDMA) and Pollution Control Board."
        ]
        for r in recs:
            elements.append(Paragraph(r, styles['Normal']))
            elements.append(Spacer(1, 4))

        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Dossier_{inc.id}.pdf"}
        )

    except Exception as e:
        # Fallback text response if reportlab is not installed
        content = f"THERMIVEX EMERGENCY DOSSIER\nIncident: {inc.id}\nFacility: {inc.facility_name}\nRisk Score: {inc.risk_score}/100\nSeverity: {inc.severity_label}\nFRP: {inc.frp_total} MW\nCoordinates: {inc.latitude}, {inc.longitude}\n"
        return Response(content=content, media_type="text/plain")
