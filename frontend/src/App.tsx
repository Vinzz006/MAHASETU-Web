import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CanonicalInspector } from './components/CanonicalInspector';
import { NotificationDrawer } from './components/NotificationDrawer';
import { GuidedTourModal } from './components/GuidedTourModal';
import { AssistantChat } from './components/AssistantChat';
import { Loader2 } from 'lucide-react';

// Dynamic code-splitting helper for named exports
const lazyNamed = (importer: () => Promise<any>, name: string) =>
  React.lazy(() => importer().then((module) => ({ default: module[name] })));

// =====================================================================
// --- CORE INTEROPERABILITY PAGES (Problem Statement 26129) ---
// =====================================================================
const LandingPage = lazyNamed(() => import('./pages/citizen/LandingPage'), 'LandingPage');
const LoginPage = lazyNamed(() => import('./pages/citizen/LoginPage'), 'LoginPage');
const DashboardPage = lazyNamed(() => import('./pages/citizen/DashboardPage'), 'DashboardPage');
const ResidentProfilePage = lazyNamed(() => import('./pages/citizen/ResidentProfilePage'), 'ResidentProfilePage');
const ServicesPage = lazyNamed(() => import('./pages/citizen/ServicesPage'), 'ServicesPage');
const ApplicationFormPage = lazyNamed(() => import('./pages/citizen/ApplicationFormPage'), 'ApplicationFormPage');
const ConsentPage = lazyNamed(() => import('./pages/citizen/ConsentPage'), 'ConsentPage');
const TrackingPage = lazyNamed(() => import('./pages/citizen/TrackingPage'), 'TrackingPage');
const PassportCertificatePage = lazyNamed(() => import('./pages/citizen/PassportCertificatePage'), 'PassportCertificatePage');
const PublicPassportVerifierPage = lazyNamed(() => import('./pages/public/PublicPassportVerifierPage'), 'PublicPassportVerifierPage');
const OfficerDashboardPage = lazyNamed(() => import('./pages/admin/OfficerDashboardPage'), 'OfficerDashboardPage');
const AdminDashboardPage = lazyNamed(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminAnalyticsPage = lazyNamed(() => import('./pages/admin/AdminAnalyticsPage'), 'AdminAnalyticsPage');
const CitizenManagementPage = lazyNamed(() => import('./pages/admin/CitizenManagementPage'), 'CitizenManagementPage');
const DepartmentDashboardPage = lazyNamed(() => import('./pages/admin/DepartmentDashboardPage'), 'DepartmentDashboardPage');
const AuditorDashboardPage = lazyNamed(() => import('./pages/auditor/AuditorDashboardPage'), 'AuditorDashboardPage');
const IntegrationsMonitorPage = lazyNamed(() => import('./pages/admin/IntegrationsMonitorPage'), 'IntegrationsMonitorPage');
const SchemaMapperPage = lazyNamed(() => import('./pages/admin/SchemaMapperPage'), 'SchemaMapperPage');
const GrievanceManagementPage = lazyNamed(() => import('./pages/admin/GrievanceManagementPage'), 'GrievanceManagementPage');
const ServicesManagementPage = lazyNamed(() => import('./pages/admin/ServicesManagementPage'), 'ServicesManagementPage');

// =====================================================================
// --- INNOVATION LAB / ADDITIONAL MODULES (EXPLORATORY EXTENSIONS) ---
// Code-split to minimize core entry bundle size
// =====================================================================
const CitizenLockerPage = lazyNamed(() => import('./pages/citizen/CitizenLockerPage'), 'CitizenLockerPage');
const MahaSetuVaaniPage = lazyNamed(() => import('./pages/citizen/MahaSetuVaaniPage'), 'MahaSetuVaaniPage');
const VerifiableCredentialPage = lazyNamed(() => import('./pages/citizen/VerifiableCredentialPage'), 'VerifiableCredentialPage');
const MahaNivaranaPage = lazyNamed(() => import('./pages/citizen/MahaNivaranaPage'), 'MahaNivaranaPage');
const ProactiveEntitlementsPage = lazyNamed(() => import('./pages/citizen/ProactiveEntitlementsPage'), 'ProactiveEntitlementsPage');
const InterstatePortabilityPage = lazyNamed(() => import('./pages/citizen/InterstatePortabilityPage'), 'InterstatePortabilityPage');
const DPDPErasurePage = lazyNamed(() => import('./pages/citizen/DPDPErasurePage'), 'DPDPErasurePage');
const DiasporaGatewayPage = lazyNamed(() => import('./pages/citizen/DiasporaGatewayPage'), 'DiasporaGatewayPage');
const AccessibilityAssistPage = lazyNamed(() => import('./pages/citizen/AccessibilityAssistPage'), 'AccessibilityAssistPage');
const DronePMFBYPage = lazyNamed(() => import('./pages/citizen/DronePMFBYPage'), 'DronePMFBYPage');
const ZKPropertyTaxPage = lazyNamed(() => import('./pages/citizen/ZKPropertyTaxPage'), 'ZKPropertyTaxPage');
const VoiceHotlineAgentPage = lazyNamed(() => import('./pages/citizen/VoiceHotlineAgentPage'), 'VoiceHotlineAgentPage');
const PoliceCCTNSPage = lazyNamed(() => import('./pages/citizen/PoliceCCTNSPage'), 'PoliceCCTNSPage');
const MeriPehchaanSSOPage = lazyNamed(() => import('./pages/citizen/MeriPehchaanSSOPage'), 'MeriPehchaanSSOPage');
const MarriageRegistryPage = lazyNamed(() => import('./pages/citizen/MarriageRegistryPage'), 'MarriageRegistryPage');

const ConnectorStudioPage = lazyNamed(() => import('./pages/admin/ConnectorStudioPage'), 'ConnectorStudioPage');
const EventRadarPage = lazyNamed(() => import('./pages/admin/EventRadarPage'), 'EventRadarPage');
const SLAMonitorPage = lazyNamed(() => import('./pages/admin/SLAMonitorPage'), 'SLAMonitorPage');
const ExecutiveAuditReportPage = lazyNamed(() => import('./pages/admin/ExecutiveAuditReportPage'), 'ExecutiveAuditReportPage');
const DataLineagePage = lazyNamed(() => import('./pages/admin/DataLineagePage'), 'DataLineagePage');
const GraminEdgeSyncPage = lazyNamed(() => import('./pages/admin/GraminEdgeSyncPage'), 'GraminEdgeSyncPage');
const FraudDetectorPage = lazyNamed(() => import('./pages/admin/FraudDetectorPage'), 'FraudDetectorPage');
const PolicySimulatorPage = lazyNamed(() => import('./pages/admin/PolicySimulatorPage'), 'PolicySimulatorPage');
const SecurityAuditPage = lazyNamed(() => import('./pages/admin/SecurityAuditPage'), 'SecurityAuditPage');
const NationalDPIGatewayPage = lazyNamed(() => import('./pages/admin/NationalDPIGatewayPage'), 'NationalDPIGatewayPage');
const DBTDisbursalLedgerPage = lazyNamed(() => import('./pages/admin/DBTDisbursalLedgerPage'), 'DBTDisbursalLedgerPage');
const FieldVerificationPage = lazyNamed(() => import('./pages/admin/FieldVerificationPage'), 'FieldVerificationPage');
const MahaDarpanCockpitPage = lazyNamed(() => import('./pages/admin/MahaDarpanCockpitPage'), 'MahaDarpanCockpitPage');
const WebhookMeshPage = lazyNamed(() => import('./pages/admin/WebhookMeshPage'), 'WebhookMeshPage');
const ChaosSimulatorPage = lazyNamed(() => import('./pages/admin/ChaosSimulatorPage'), 'ChaosSimulatorPage');
const ConfidentialMPCPage = lazyNamed(() => import('./pages/admin/ConfidentialMPCPage'), 'ConfidentialMPCPage');
const GreenGovTechPage = lazyNamed(() => import('./pages/admin/GreenGovTechPage'), 'GreenGovTechPage');
const PQCSandboxPage = lazyNamed(() => import('./pages/admin/PQCSandboxPage'), 'PQCSandboxPage');
const DisasterSurgePage = lazyNamed(() => import('./pages/admin/DisasterSurgePage'), 'DisasterSurgePage');
const DocumentForensicsPage = lazyNamed(() => import('./pages/admin/DocumentForensicsPage'), 'DocumentForensicsPage');
const AutonomousMeshPage = lazyNamed(() => import('./pages/admin/AutonomousMeshPage'), 'AutonomousMeshPage');
const DeveloperSDKPage = lazyNamed(() => import('./pages/admin/DeveloperSDKPage'), 'DeveloperSDKPage');
const ExecutiveWarRoomPage = lazyNamed(() => import('./pages/admin/ExecutiveWarRoomPage'), 'ExecutiveWarRoomPage');
const MerkleAuditLedgerPage = lazyNamed(() => import('./pages/admin/MerkleAuditLedgerPage'), 'MerkleAuditLedgerPage');
const WorkforceRebalancerPage = lazyNamed(() => import('./pages/admin/WorkforceRebalancerPage'), 'WorkforceRebalancerPage');
const CapstoneShowcasePage = lazyNamed(() => import('./pages/admin/CapstoneShowcasePage'), 'CapstoneShowcasePage');
const SmartEscrowPage = lazyNamed(() => import('./pages/admin/SmartEscrowPage'), 'SmartEscrowPage');
const BhoomiGeoCadastrePage = lazyNamed(() => import('./pages/admin/BhoomiGeoCadastrePage'), 'BhoomiGeoCadastrePage');
const TribunalNyayaPage = lazyNamed(() => import('./pages/admin/TribunalNyayaPage'), 'TribunalNyayaPage');
const VanadhikarFRAPage = lazyNamed(() => import('./pages/admin/VanadhikarFRAPage'), 'VanadhikarFRAPage');
const TreasuryBeAMSPage = lazyNamed(() => import('./pages/admin/TreasuryBeAMSPage'), 'TreasuryBeAMSPage');
const TenderShieldPage = lazyNamed(() => import('./pages/admin/TenderShieldPage'), 'TenderShieldPage');
const CrisisLogisticsPage = lazyNamed(() => import('./pages/admin/CrisisLogisticsPage'), 'CrisisLogisticsPage');
const QuantumKeyRotationPage = lazyNamed(() => import('./pages/admin/QuantumKeyRotationPage'), 'QuantumKeyRotationPage');
const LifeEventsMeshPage = lazyNamed(() => import('./pages/admin/LifeEventsMeshPage'), 'LifeEventsMeshPage');
const EpidemicSurveillancePage = lazyNamed(() => import('./pages/admin/EpidemicSurveillancePage'), 'EpidemicSurveillancePage');
const KioskSolarPage = lazyNamed(() => import('./pages/admin/KioskSolarPage'), 'KioskSolarPage');
const PDSRationOptimizerPage = lazyNamed(() => import('./pages/admin/PDSRationOptimizerPage'), 'PDSRationOptimizerPage');
const JalJeevanTelemetryPage = lazyNamed(() => import('./pages/admin/JalJeevanTelemetryPage'), 'JalJeevanTelemetryPage');
const EVGridBalancerPage = lazyNamed(() => import('./pages/admin/EVGridBalancerPage'), 'EVGridBalancerPage');
const IndustrialEmissionsPage = lazyNamed(() => import('./pages/admin/IndustrialEmissionsPage'), 'IndustrialEmissionsPage');
const SolarFeederGridPage = lazyNamed(() => import('./pages/admin/SolarFeederGridPage'), 'SolarFeederGridPage');
const PolicyCopilotPage = lazyNamed(() => import('./pages/admin/PolicyCopilotPage'), 'PolicyCopilotPage');
const MasterShowcasePage = lazyNamed(() => import('./pages/admin/MasterShowcasePage'), 'MasterShowcasePage');
const InnovationLabPage = lazyNamed(() => import('./pages/admin/InnovationLabPage'), 'InnovationLabPage');

function PageLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      <p className="text-sm font-medium">Loading MahaSetu Module...</p>
    </div>
  );
}

export function App() {
  const [isTourOpen, setIsTourOpen] = React.useState(false);

  return (
    <LanguageProvider>
      <AuthProvider>
        <DemoProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
              <Navbar onOpenTour={() => setIsTourOpen(true)} />
              <main className="flex-1 flex flex-col pb-16">
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    {/* --- Core Interoperability Citizen Flow --- */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:serviceId/apply" element={<ApplicationFormPage />} />
                    <Route path="/citizen/dashboard" element={<DashboardPage />} />
                    <Route path="/citizen/profile" element={<ResidentProfilePage />} />
                    <Route path="/applications/:id/consent" element={<ConsentPage />} />
                    <Route path="/applications/:id/track" element={<TrackingPage />} />
                    <Route path="/passport/:id" element={<PassportCertificatePage />} />

                    {/* --- Core Interoperability Officer & Admin Flow --- */}
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/officer" element={<OfficerDashboardPage />} />
                    <Route path="/admin/citizens" element={<CitizenManagementPage />} />
                    <Route path="/department/dashboard" element={<DepartmentDashboardPage />} />
                    <Route path="/auditor/dashboard" element={<AuditorDashboardPage />} />
                    <Route path="/admin/integrations" element={<IntegrationsMonitorPage />} />
                    <Route path="/admin/schema-mapper" element={<SchemaMapperPage />} />
                    <Route path="/admin/services" element={<ServicesManagementPage />} />
                    <Route path="/admin/grievances" element={<GrievanceManagementPage />} />
                    <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />

                    {/* --- Public Verifier --- */}
                    <Route path="/passport/verify/:id" element={<PublicPassportVerifierPage />} />

                    {/* --- Innovation Lab / Additional Showcase Routes (Aliases Supported) --- */}
                    {/* Citizen Showcase Modules */}
                    <Route path="/citizen/locker" element={<CitizenLockerPage />} />
                    <Route path="/lab/locker" element={<CitizenLockerPage />} />
                    <Route path="/citizen/vaani" element={<MahaSetuVaaniPage />} />
                    <Route path="/lab/vaani" element={<MahaSetuVaaniPage />} />
                    <Route path="/citizen/credentials" element={<VerifiableCredentialPage />} />
                    <Route path="/lab/credentials" element={<VerifiableCredentialPage />} />
                    <Route path="/citizen/nivarana" element={<MahaNivaranaPage />} />
                    <Route path="/lab/nivarana" element={<MahaNivaranaPage />} />
                    <Route path="/citizen/entitlements" element={<ProactiveEntitlementsPage />} />
                    <Route path="/lab/entitlements" element={<ProactiveEntitlementsPage />} />
                    <Route path="/citizen/interstate" element={<InterstatePortabilityPage />} />
                    <Route path="/lab/interstate" element={<InterstatePortabilityPage />} />
                    <Route path="/citizen/privacy-erasure" element={<DPDPErasurePage />} />
                    <Route path="/lab/privacy-erasure" element={<DPDPErasurePage />} />
                    <Route path="/citizen/diaspora" element={<DiasporaGatewayPage />} />
                    <Route path="/lab/diaspora" element={<DiasporaGatewayPage />} />
                    <Route path="/citizen/accessibility" element={<AccessibilityAssistPage />} />
                    <Route path="/lab/accessibility" element={<AccessibilityAssistPage />} />
                    <Route path="/citizen/drone-pmfby" element={<DronePMFBYPage />} />
                    <Route path="/lab/drone-pmfby" element={<DronePMFBYPage />} />
                    <Route path="/citizen/zk-property-tax" element={<ZKPropertyTaxPage />} />
                    <Route path="/lab/zk-property-tax" element={<ZKPropertyTaxPage />} />
                    <Route path="/citizen/voice-hotline" element={<VoiceHotlineAgentPage />} />
                    <Route path="/lab/voice-hotline" element={<VoiceHotlineAgentPage />} />
                    <Route path="/citizen/police-cctns" element={<PoliceCCTNSPage />} />
                    <Route path="/lab/police-cctns" element={<PoliceCCTNSPage />} />
                    <Route path="/citizen/meripehchaan" element={<MeriPehchaanSSOPage />} />
                    <Route path="/lab/meripehchaan" element={<MeriPehchaanSSOPage />} />
                    <Route path="/citizen/marriage-registry" element={<MarriageRegistryPage />} />
                    <Route path="/lab/marriage-registry" element={<MarriageRegistryPage />} />

                    {/* Admin & Officer Showcase Modules */}
                    <Route path="/admin/connectors-studio" element={<ConnectorStudioPage />} />
                    <Route path="/lab/connectors-studio" element={<ConnectorStudioPage />} />
                    <Route path="/admin/event-radar" element={<EventRadarPage />} />
                    <Route path="/lab/event-radar" element={<EventRadarPage />} />
                    <Route path="/admin/sla-monitor" element={<SLAMonitorPage />} />
                    <Route path="/lab/sla-monitor" element={<SLAMonitorPage />} />
                    <Route path="/admin/fraud-detector" element={<FraudDetectorPage />} />
                    <Route path="/lab/fraud-detector" element={<FraudDetectorPage />} />
                    <Route path="/admin/policy-simulator" element={<PolicySimulatorPage />} />
                    <Route path="/lab/policy-simulator" element={<PolicySimulatorPage />} />
                    <Route path="/admin/security-audit" element={<SecurityAuditPage />} />
                    <Route path="/lab/security-audit" element={<SecurityAuditPage />} />
                    <Route path="/admin/dpi-gateway" element={<NationalDPIGatewayPage />} />
                    <Route path="/lab/dpi-gateway" element={<NationalDPIGatewayPage />} />
                    <Route path="/admin/disbursal-ledger" element={<DBTDisbursalLedgerPage />} />
                    <Route path="/lab/disbursal-ledger" element={<DBTDisbursalLedgerPage />} />
                    <Route path="/officer/field-verify" element={<FieldVerificationPage />} />
                    <Route path="/lab/field-verify" element={<FieldVerificationPage />} />
                    <Route path="/admin/audit-report" element={<ExecutiveAuditReportPage />} />
                    <Route path="/lab/audit-report" element={<ExecutiveAuditReportPage />} />
                    <Route path="/admin/lineage" element={<DataLineagePage />} />
                    <Route path="/admin/lineage/:id" element={<DataLineagePage />} />
                    <Route path="/lab/lineage" element={<DataLineagePage />} />
                    <Route path="/admin/edge-sync" element={<GraminEdgeSyncPage />} />
                    <Route path="/lab/edge-sync" element={<GraminEdgeSyncPage />} />
                    <Route path="/admin/mahadrpan" element={<MahaDarpanCockpitPage />} />
                    <Route path="/lab/mahadrpan" element={<MahaDarpanCockpitPage />} />
                    <Route path="/admin/webhooks" element={<WebhookMeshPage />} />
                    <Route path="/lab/webhooks" element={<WebhookMeshPage />} />
                    <Route path="/admin/chaos" element={<ChaosSimulatorPage />} />
                    <Route path="/lab/chaos" element={<ChaosSimulatorPage />} />
                    <Route path="/admin/mpc" element={<ConfidentialMPCPage />} />
                    <Route path="/lab/mpc" element={<ConfidentialMPCPage />} />
                    <Route path="/admin/green-gov" element={<GreenGovTechPage />} />
                    <Route path="/lab/green-gov" element={<GreenGovTechPage />} />
                    <Route path="/admin/pqc" element={<PQCSandboxPage />} />
                    <Route path="/lab/pqc" element={<PQCSandboxPage />} />
                    <Route path="/admin/disaster-surge" element={<DisasterSurgePage />} />
                    <Route path="/lab/disaster-surge" element={<DisasterSurgePage />} />
                    <Route path="/admin/document-forensics" element={<DocumentForensicsPage />} />
                    <Route path="/lab/document-forensics" element={<DocumentForensicsPage />} />
                    <Route path="/admin/mesh-autonomous" element={<AutonomousMeshPage />} />
                    <Route path="/lab/mesh-autonomous" element={<AutonomousMeshPage />} />
                    <Route path="/admin/developer-sdk" element={<DeveloperSDKPage />} />
                    <Route path="/lab/developer-sdk" element={<DeveloperSDKPage />} />
                    <Route path="/admin/war-room" element={<ExecutiveWarRoomPage />} />
                    <Route path="/lab/war-room" element={<ExecutiveWarRoomPage />} />
                    <Route path="/admin/merkle-ledger" element={<MerkleAuditLedgerPage />} />
                    <Route path="/lab/merkle-ledger" element={<MerkleAuditLedgerPage />} />
                    <Route path="/admin/workforce-rebalance" element={<WorkforceRebalancerPage />} />
                    <Route path="/lab/workforce-rebalance" element={<WorkforceRebalancerPage />} />
                    <Route path="/admin/capstone-showcase" element={<CapstoneShowcasePage />} />
                    <Route path="/lab/capstone-showcase" element={<CapstoneShowcasePage />} />
                    <Route path="/admin/smart-escrow" element={<SmartEscrowPage />} />
                    <Route path="/lab/smart-escrow" element={<SmartEscrowPage />} />
                    <Route path="/admin/bhoomi-cadastre" element={<BhoomiGeoCadastrePage />} />
                    <Route path="/lab/bhoomi-cadastre" element={<BhoomiGeoCadastrePage />} />
                    <Route path="/admin/tribunal-nyaya" element={<TribunalNyayaPage />} />
                    <Route path="/lab/tribunal-nyaya" element={<TribunalNyayaPage />} />
                    <Route path="/admin/tribal-fra" element={<VanadhikarFRAPage />} />
                    <Route path="/lab/tribal-fra" element={<VanadhikarFRAPage />} />
                    <Route path="/admin/treasury-beams" element={<TreasuryBeAMSPage />} />
                    <Route path="/lab/treasury-beams" element={<TreasuryBeAMSPage />} />
                    <Route path="/admin/tender-shield" element={<TenderShieldPage />} />
                    <Route path="/lab/tender-shield" element={<TenderShieldPage />} />
                    <Route path="/admin/crisis-logistics" element={<CrisisLogisticsPage />} />
                    <Route path="/lab/crisis-logistics" element={<CrisisLogisticsPage />} />
                    <Route path="/admin/key-rotation" element={<QuantumKeyRotationPage />} />
                    <Route path="/lab/key-rotation" element={<QuantumKeyRotationPage />} />
                    <Route path="/admin/life-events" element={<LifeEventsMeshPage />} />
                    <Route path="/lab/life-events" element={<LifeEventsMeshPage />} />
                    <Route path="/admin/epidemic-surveillance" element={<EpidemicSurveillancePage />} />
                    <Route path="/lab/epidemic-surveillance" element={<EpidemicSurveillancePage />} />
                    <Route path="/admin/kiosk-solar" element={<KioskSolarPage />} />
                    <Route path="/lab/kiosk-solar" element={<KioskSolarPage />} />
                    <Route path="/admin/pds-ration" element={<PDSRationOptimizerPage />} />
                    <Route path="/lab/pds-ration" element={<PDSRationOptimizerPage />} />
                    <Route path="/admin/jal-jeevan" element={<JalJeevanTelemetryPage />} />
                    <Route path="/lab/jal-jeevan" element={<JalJeevanTelemetryPage />} />
                    <Route path="/admin/ev-grid" element={<EVGridBalancerPage />} />
                    <Route path="/lab/ev-grid" element={<EVGridBalancerPage />} />
                    <Route path="/admin/industrial-emissions" element={<IndustrialEmissionsPage />} />
                    <Route path="/lab/industrial-emissions" element={<IndustrialEmissionsPage />} />
                    <Route path="/admin/solar-feeder" element={<SolarFeederGridPage />} />
                    <Route path="/lab/solar-feeder" element={<SolarFeederGridPage />} />
                    <Route path="/admin/policy-copilot" element={<PolicyCopilotPage />} />
                    <Route path="/lab/policy-copilot" element={<PolicyCopilotPage />} />
                    <Route path="/admin/master-showcase" element={<MasterShowcasePage />} />
                    <Route path="/lab/master-showcase" element={<MasterShowcasePage />} />
                    <Route path="/admin/innovation-lab" element={<InnovationLabPage />} />
                    <Route path="/lab/innovation-lab" element={<InnovationLabPage />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <NotificationDrawer />
              <GuidedTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
              <CanonicalInspector />
              <AssistantChat />
            </div>
          </Router>
        </DemoProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
