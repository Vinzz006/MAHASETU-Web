from backend.app.database import get_db
from backend.app.models.application import Application
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/vaani", tags=["AI Multilingual Voice Assistant (MahaSetu Vaani)"]
)


class VaaniQueryRequest(BaseModel):
    query_text: str
    language: str = "mr"  # "mr" (Marathi) or "en" (English)
    citizen_mobile: str | None = "9999999999"


@router.post("/query")
def process_vaani_voice_query(req: VaaniQueryRequest, db: Session = Depends(get_db)):
    q = req.query_text.lower().strip()
    lang = req.language

    # Fetch latest application for demo citizen if available
    latest_app = db.query(Application).order_by(Application.created_at.desc()).first()
    app_num = latest_app.application_number if latest_app else "MH-APP-2026-000184"
    app_status = latest_app.status if latest_app else "COMPLETED"

    # Intent Detection based on Marathi & English keywords
    if any(
        k in q for k in ["status", "स्थिती", "कुठे आहे", "काय झाले", "track", "अर्जाची"]
    ):
        intent = "STATUS_INQUIRY"
        status_label_mr = (
            "मंजूर झाली आहे आणि डिजिटल सेवा पासपोर्ट जारी करण्यात आला आहे"
            if app_status == "COMPLETED"
            else "सध्या तपासणी प्रक्रियेत आहे"
        )
        status_label_en = (
            "has been Approved and the Digital Service Passport is Issued"
            if app_status == "COMPLETED"
            else "is currently under multi-department verification"
        )

        response_mr = f"नमस्कार! आपला अर्ज क्रमांक {app_num} {status_label_mr}. महासेतू पोर्टलवर सर्व विभागांचा समन्वय पूर्ण झाला आहे."
        response_en = f"Hello! Your application {app_num} {status_label_en}. Multi-department verification has been synchronized via MahaSetu."
        action_url = (
            f"/applications/{latest_app.id}/track"
            if latest_app
            else "/citizen/dashboard"
        )

    elif any(k in q for k in ["farmer", "शेतकरी", "dbt", "अनुदान", "शेती", "कृषी"]):
        intent = "FARMER_SCHEME_INQUIRY"
        response_mr = "महाडीबीटी शेतकरी कृषी सहाय्य योजनेअंतर्गत वर्षाला १२,००० रुपये थेट बँक खात्यात जमा केले जातात. आपले ७/१२ भूलेख डिजिटल पद्धतीने जोडले गेले आहे."
        response_en = "Under the MahaDBT Farmer Assistance Scheme, Rs. 12,000 annual subsidy is directly transferred. Your 7/12 Land Registry record is digitally federated."
        action_url = "/services/farmer-dbt/apply"

    elif any(k in q for k in ["housing", "घरकुल", "घर", "आवास", "urban"]):
        intent = "HOUSING_SCHEME_INQUIRY"
        response_mr = "महाराष्ट्र नागरी परवडणारे घरकुल योजनेअंतर्गत २,५०,००० रुपयांचे व्याज अनुदान दिले जाते. यासाठी उत्पन्न दाखला महसूल विभागाकडून आपोआप पडताळला जातो."
        response_en = "Under Maharashtra Urban Affordable Housing Scheme, Rs. 2,50,000 interest subsidy is provided. Income certificates are verified automatically via Revenue Department."
        action_url = "/services/urban-housing/apply"

    elif any(k in q for k in ["passport", "पासपोर्ट", "प्रमाणपत्र", "certificate"]):
        intent = "PASSPORT_INQUIRY"
        response_mr = f"आपला अधिकृत डिजिटल सेवा पासपोर्ट तयार आहे! अर्ज क्रमांक {app_num} चा क्यूआर कोड आणि डिजिटल स्वाक्षरी असलेले प्रमाणपत्र आपण कधीही तपासू शकता."
        response_en = f"Your official Digital Service Passport is ready! You can view or verify the QR-stamped credential for application {app_num} anytime."
        action_url = f"/passport/{app_num}"

    elif any(k in q for k in ["consent", "संमती", "dpdp", "सुरक्षा", "data"]):
        intent = "CONSENT_INQUIRY"
        response_mr = "आपला डेटा डीपीडीपी कायदा २०२३ अंतर्गत पूर्णपणे सुरक्षित आहे. आपल्या संमतीशिवाय कोणताही विभाग आपली माहिती पाहू शकत नाही. ही संमती ९० दिवसांसाठी वैध असते."
        response_en = "Your personal data is strictly protected under DPDP Act, 2023. No department can access your records without cryptographic consent valid for 90 days."
        action_url = "/citizen/locker"

    else:
        intent = "GENERAL_ASSISTANCE"
        response_mr = "मी महासेतू वाणी - आपला शासकीय डिजिटल सहाय्यक आहे. आपण अर्जाची स्थिती, शेतकरी योजना, घरकुल अनुदान किंवा सेवा पासपोर्टबद्दल विचारू शकता."
        response_en = "I am MahaSetu Vaani, your digital public service voice assistant. You can ask me about application status, Farmer DBT, housing grants, or your Service Passport."
        action_url = "/services"

    return {
        "query_text": req.query_text,
        "language": lang,
        "intent": intent,
        "spoken_response": response_mr if lang == "mr" else response_en,
        "response_mr": response_mr,
        "response_en": response_en,
        "action_url": action_url,
        "application_number": app_num,
        "application_status": app_status,
        "audio_synthesis_ready": True,
    }
