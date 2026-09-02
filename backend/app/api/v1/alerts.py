import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import AlertDispatch, IncidentEvent

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class DispatchRequest(BaseModel):
    incident_id: str
    channel: str = "TELEGRAM_BOT" # TELEGRAM_BOT, SMS, ERSS_112
    recipient: str = "MIDC_INDUSTRIAL_FIRE_STN_02"
    notes: Optional[str] = "Immediate foam tender dispatch recommended"

@router.post("/dispatch", status_code=status.HTTP_202_ACCEPTED)
def dispatch_alert(req: DispatchRequest, db: Session = Depends(get_db)):
    """Triggers and logs simulated emergency dispatch to industrial safety units."""
    inc = db.query(IncidentEvent).filter(IncidentEvent.id == req.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    tier = "CRITICAL_RED" if inc.risk_score >= 70 else "AMBER_WARNING"
    payload = {
        "incident_id": inc.id,
        "facility": inc.facility_name,
        "coordinates": [inc.longitude, inc.latitude],
        "risk_score": inc.risk_score,
        "classification": inc.classification,
        "frp_mw": inc.frp_total,
        "dispatch_notes": req.notes
    }

    dispatch_record = AlertDispatch(
        incident_id=inc.id,
        alert_tier=tier,
        channel=req.channel,
        recipient=req.recipient,
        dispatch_status="DELIVERED",
        payload_snapshot=json.dumps(payload)
    )
    db.add(dispatch_record)
    db.commit()
    db.refresh(dispatch_record)

    return {
        "status": "DISPATCHED",
        "dispatch_id": dispatch_record.id,
        "incident_id": inc.id,
        "target_recipient": req.recipient,
        "alert_tier": tier,
        "channel": req.channel,
        "message": f"Emergency alert successfully broadcast to {req.recipient}."
    }

@router.get("/history")
def get_dispatch_history(limit: int = 20, db: Session = Depends(get_db)):
    """Returns recent emergency notification dispatches."""
    alerts = db.query(AlertDispatch).order_by(desc(AlertDispatch.dispatched_at)).limit(limit).all()
    results = []
    for a in alerts:
        results.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "tier": a.alert_tier,
            "channel": a.channel,
            "recipient": a.recipient,
            "status": a.dispatch_status,
            "timestamp": a.dispatched_at.isoformat()
        })
    return results
