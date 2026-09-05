import io
import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import IncidentEvent, AlertDispatch
from app.services.ml_service import generate_shap_attributions

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dossier/{incident_id}/json")
def get_dossier_json(incident_id: str, db: Session = Depends(get_db)):
    """Returns structured tactical dossier for post-incident audit."""
    inc: Any = db.query(IncidentEvent).filter(IncidentEvent.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    shap_factors = generate_shap_attributions(
        frp=float(inc.frp_total),
        delta_z=float(inc.frp_delta_zscore),
        dist_to_facility_m=float(inc.dist_to_facility_m) if inc.dist_to_facility_m is not None else 0.0,
        facility_name=str(inc.facility_name or ""),
        daynight=str(inc.daynight),
        temp_diff=float(inc.temp_differential),
        predicted_class=str(inc.classification)
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
            "coordinates": [round(float(inc.longitude), 5), round(float(inc.latitude), 5)],
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
    inc: Any = db.query(IncidentEvent).filter(IncidentEvent.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements: list[Flowable] = []
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
            ["Incident ID:", str(inc.id), "Classification:", str(inc.classification)],
            ["Facility:", str(inc.facility_name or "Unknown"), "Severity:", str(inc.severity_label)],
            ["Risk Score:", f"{inc.risk_score} / 100", "Detection Time:", f"{inc.acq_date} {inc.acq_time} UTC"],
            ["Coordinates:", f"{float(inc.latitude):.4f}° N, {float(inc.longitude):.4f}° E", "Satellite:", f"{inc.satellite} ({inc.daynight})"],
            ["FRP (Power):", f"{float(inc.frp_total):.1f} MW", "Thermal Differential:", f"+{float(inc.temp_differential):.1f} K"],
            ["Anomaly Surge:", f"+{float(inc.frp_delta_zscore):.1f} Sigma", "Persistence Index:", f"{float(inc.persistence_index):.2f}"]
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

    except Exception:
        content = f"THERMIVEX EMERGENCY DOSSIER\nIncident: {inc.id}\nFacility: {inc.facility_name}\nRisk Score: {inc.risk_score}/100\nSeverity: {inc.severity_label}\nFRP: {inc.frp_total} MW\nCoordinates: {inc.latitude}, {inc.longitude}\n"
        return Response(content=content, media_type="text/plain")

@router.get("/sitrep/summary")
def get_sitrep_summary(db: Session = Depends(get_db)):
    """
    Returns an aggregated National Situational Report (SitRep) for disaster management command centers.
    """
    incidents: Any = db.query(IncidentEvent).all()
    dispatches: Any = db.query(AlertDispatch).all()

    critical_count = sum(1 for i in incidents if i.severity_label == "CRITICAL")
    high_count = sum(1 for i in incidents if i.severity_label == "HIGH")
    routine_count = sum(1 for i in incidents if i.classification == "PERSISTENT_OPERATIONAL_SOURCE")
    total_frp = sum(float(i.frp_total) for i in incidents)

    top_incident: Any = None
    if incidents:
        top_incident = max(incidents, key=lambda x: x.risk_score)

    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return {
        "title": "NATIONAL INDUSTRIAL THERMAL HAZARD SITUATIONAL REPORT (SITREP)",
        "generated_at": now_utc,
        "reporting_agency": "NDMA / THERMIVEX Spaceborne Early Warning Directorate",
        "threat_level": "RED ADVISORY" if critical_count > 0 else "AMBER WATCH",
        "macro_metrics": {
            "total_active_clusters": len(incidents),
            "critical_disasters": critical_count,
            "high_risk_perimeters": high_count,
            "routine_flaring_sources": routine_count,
            "cumulative_radiative_flux_mw": round(float(total_frp), 1),
            "total_emergency_dispatches": len(dispatches)
        },
        "highest_priority_target": {
            "incident_id": top_incident.id if top_incident else None,
            "facility_name": top_incident.facility_name if top_incident else None,
            "risk_score": top_incident.risk_score if top_incident else 0,
            "severity": top_incident.severity_label if top_incident else "NONE",
            "frp_mw": float(top_incident.frp_total) if top_incident else 0.0,
            "location": f"{float(top_incident.latitude):.4f}° N, {float(top_incident.longitude):.4f}° E" if top_incident else None
        },
        "actionable_directives": [
            "1. Priority mobilization of industrial foam tenders to Dahej PCPIR Sector 3.",
            "2. Activate downwind air quality monitoring for VOCs and SO2 in East-Southeast corridor.",
            "3. Continue automated satellite telemetry ingestion via NOAA-20 / Sentinel-2 SWIR."
        ]
    }

@router.get("/sitrep/markdown")
def get_sitrep_markdown(db: Session = Depends(get_db)):
    """
    Exports the SitRep formatted as a clean Markdown text document.
    """
    sitrep = get_sitrep_summary(db)
    m = sitrep["macro_metrics"]
    target = sitrep["highest_priority_target"]

    md_text = f"""# {sitrep['title']}
**Classification Level:** RESTRICTED // OPERATIONAL DISASTER INTELLIGENCE  
**Generated At:** {sitrep['generated_at']}  
**Reporting Agency:** {sitrep['reporting_agency']}  
**National Threat Status:** **{sitrep['threat_level']}**  

---

## 1. Executive Situation Summary
- **Active Hotspot Clusters Monitored:** {m['total_active_clusters']}
- **Confirmed Critical Industrial Blazes:** {m['critical_disasters']}
- **High-Risk Perimeter Anomalies:** {m['high_risk_perimeters']}
- **Routine Operational Heat Sources (Suppressed):** {m['routine_flaring_sources']}
- **Cumulative Radiative Energy Release:** {m['cumulative_radiative_flux_mw']} MW
- **Disaster Dispatch Notices Issued:** {m['total_emergency_dispatches']}

---

## 2. Highest Priority Critical Target
- **Incident Reference:** `#{target['incident_id']}`
- **Facility Complex:** **{target['facility_name']}**
- **Composite Risk Score:** **{target['risk_score']} / 100 ({target['severity']})**
- **Radiative Power:** {target['frp_mw']} MW
- **Geographic Coordinates:** {target['location']}

---

## 3. Mandatory Tactical Directives for District Emergency Officers
{chr(10).join(sitrep['actionable_directives'])}

*Document generated automatically by THERMIVEX Geospatial Early Warning Engine.*
"""
    return Response(
        content=md_text,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=THERMIVEX_National_SitRep.md"}
    )

@router.get("/sitrep/pdf")
def get_sitrep_pdf(db: Session = Depends(get_db)):
    """
    Generates and streams a formatted National Situational Report (SitRep) PDF for disaster management commanders.
    """
    sitrep = get_sitrep_summary(db)
    m = sitrep["macro_metrics"]
    target = sitrep["highest_priority_target"]
    incidents: Any = db.query(IncidentEvent).order_by(IncidentEvent.risk_score.desc()).all()

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        elements: list[Flowable] = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'SitRepTitle',
            parent=styles['Heading1'],
            fontSize=15,
            leading=19,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=2
        )
        subtitle_style = ParagraphStyle(
            'SitRepSubtitle',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#475569')
        )
        threat_style = ParagraphStyle(
            'ThreatLevel',
            parent=styles['Heading2'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#DC2626') if 'RED' in sitrep['threat_level'] else colors.HexColor('#D97706')
        )
        section_style = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=6,
            spaceAfter=4
        )
        cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1E293B')
        )
        cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=cell_style,
            fontName='Helvetica-Bold'
        )
        th_style = ParagraphStyle(
            'TableHeader',
            parent=cell_style,
            fontName='Helvetica-Bold',
            textColor=colors.white
        )

        elements.append(Paragraph("THERMIVEX NATIONAL SITUATIONAL REPORT (SITREP)", title_style))
        elements.append(Paragraph(
            f"<b>Agency:</b> {sitrep['reporting_agency']} | <b>Generated:</b> {sitrep['generated_at']}",
            subtitle_style
        ))
        elements.append(Paragraph(
            f"<b>Classification:</b> RESTRICTED // TACTICAL DISASTER INTELLIGENCE",
            subtitle_style
        ))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(f"NATIONAL THREAT STATUS: <b>{sitrep['threat_level']}</b>", threat_style))
        elements.append(Spacer(1, 8))

        # 1. Macro Metrics Table
        elements.append(Paragraph("1. EXECUTIVE SITUATION SUMMARY", section_style))
        macro_data = [
            [
                Paragraph("<b>Active Hotspots</b>", cell_bold),
                Paragraph(str(m['total_active_clusters']), cell_style),
                Paragraph("<b>Critical Industrial Fires</b>", cell_bold),
                Paragraph(f"<font color='#DC2626'><b>{m['critical_disasters']}</b></font>", cell_style)
            ],
            [
                Paragraph("<b>High-Risk Perimeters</b>", cell_bold),
                Paragraph(str(m['high_risk_perimeters']), cell_style),
                Paragraph("<b>Suppressed Routine Flares</b>", cell_bold),
                Paragraph(str(m['routine_flaring_sources']), cell_style)
            ],
            [
                Paragraph("<b>Cumulative FRP Flux</b>", cell_bold),
                Paragraph(f"{m['cumulative_radiative_flux_mw']} MW", cell_style),
                Paragraph("<b>Emergency Dispatches</b>", cell_bold),
                Paragraph(str(m['total_emergency_dispatches']), cell_style)
            ]
        ]
        macro_table = Table(macro_data, colWidths=[130, 135, 140, 135])
        macro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(macro_table)
        elements.append(Spacer(1, 8))

        # 2. Priority Target
        if target and target.get("incident_id"):
            elements.append(Paragraph("2. HIGHEST PRIORITY CRITICAL TARGET", section_style))
            priority_data = [
                [
                    Paragraph("<b>Incident Ref:</b>", cell_bold),
                    Paragraph(f"#{target['incident_id']}", cell_style),
                    Paragraph("<b>Facility Complex:</b>", cell_bold),
                    Paragraph(str(target['facility_name']), cell_style)
                ],
                [
                    Paragraph("<b>Risk Score:</b>", cell_bold),
                    Paragraph(f"<font color='#DC2626'><b>{target['risk_score']} / 100 ({target['severity']})</b></font>", cell_style),
                    Paragraph("<b>Radiative Power:</b>", cell_bold),
                    Paragraph(f"{target['frp_mw']} MW", cell_style)
                ],
                [
                    Paragraph("<b>Coordinates:</b>", cell_bold),
                    Paragraph(str(target['location']), cell_style),
                    Paragraph("<b>Status:</b>", cell_bold),
                    Paragraph("ACTIVE TACTICAL RESPONSE", cell_style)
                ]
            ]
            pri_table = Table(priority_data, colWidths=[110, 155, 120, 155])
            pri_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FECACA')),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(pri_table)
            elements.append(Spacer(1, 8))

        # 3. Active Incident Register Table
        elements.append(Paragraph("3. ACTIVE INCIDENTS REGISTER", section_style))
        table_rows = [
            [
                Paragraph("<b>ID</b>", th_style),
                Paragraph("<b>Facility</b>", th_style),
                Paragraph("<b>Class</b>", th_style),
                Paragraph("<b>Risk</b>", th_style),
                Paragraph("<b>FRP</b>", th_style),
                Paragraph("<b>Coordinates</b>", th_style)
            ]
        ]
        for inc in incidents[:10]:
            table_rows.append([
                Paragraph(str(inc.id), cell_style),
                Paragraph(str(inc.facility_name or "Unknown")[:22], cell_style),
                Paragraph(str(inc.classification).replace('_', ' ')[:16], cell_style),
                Paragraph(f"{inc.risk_score}", cell_bold),
                Paragraph(f"{float(inc.frp_total):.1f} MW", cell_style),
                Paragraph(f"{float(inc.latitude):.3f}, {float(inc.longitude):.3f}", cell_style)
            ])
        inc_table = Table(table_rows, colWidths=[65, 140, 140, 45, 65, 85])
        inc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(inc_table)
        elements.append(Spacer(1, 8))

        # 4. Mandatory Directives
        elements.append(Paragraph("4. MANDATORY TACTICAL DIRECTIVES", section_style))
        for d in sitrep.get("actionable_directives", []):
            elements.append(Paragraph(f"• {d}", cell_style))
            elements.append(Spacer(1, 2))

        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=THERMIVEX_National_SitRep.pdf"}
        )
    except Exception as e:
        content = f"THERMIVEX SITREP EXCEPTION: {str(e)}\n\n"
        return Response(content=content, media_type="text/plain")
