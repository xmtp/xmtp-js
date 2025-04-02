import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/App/AppLayout";
import { Disconnect } from "@/components/App/Disconnect";
import { ErrorModal } from "@/components/App/ErrorModal";
import { SelectConversation } from "@/components/App/SelectConversation";
import { Welcome } from "@/components/App/Welcome";
import { WelcomeLayout } from "@/components/App/WelcomeLayout";
import { LoadConversation } from "@/components/Conversation/LoadConversation";
import { LoadDM } from "@/components/Conversation/LoadDM";
import { ManageConsentModal } from "@/components/Conversation/ManageConsentModal";
import { ManageMembersModal } from "@/components/Conversation/ManageMembersModal";
import { ManagePermissionsModal } from "@/components/Conversation/ManagePermissionsModal";
import { ManagePropertiesModal } from "@/components/Conversation/ManagePropertiesModal";
import { NewConversation } from "@/components/Conversation/NewConversation";
import { IdentityModal } from "@/components/Identity/IdentityModal";
import { MessageModal } from "@/components/Messages/MessageModal";
import { useAnalytics } from "@/hooks/useAnalytics";

export const App: React.FC = () => {
  useAnalytics();

  return (
    <>
      <ErrorModal />
      <Routes>
        <Route path="/welcome" element={<WelcomeLayout />}>
          <Route index element={<Welcome />} />
        </Route>
        <Route path="/*" element={<AppLayout />}>
          <Route index element={<Navigate to="/conversations" />} />
          <Route path="dm/:address" element={<LoadDM />} />
          <Route path="conversations">
            <Route index element={<SelectConversation />} />
            <Route path="identity" element={<IdentityModal />} />
            <Route path="new" element={<NewConversation />} />
            <Route path=":conversationId" element={<LoadConversation />}>
              <Route path="identity" element={<IdentityModal />} />
              <Route path="message/:messageId" element={<MessageModal />} />
              <Route path="manage">
                <Route path="consent" element={<ManageConsentModal />} />
                <Route path="members" element={<ManageMembersModal />} />
                <Route
                  path="permissions"
                  element={<ManagePermissionsModal />}
                />
                <Route path="properties" element={<ManagePropertiesModal />} />
              </Route>
            </Route>
          </Route>
          <Route path="disconnect" element={<Disconnect />} />
        </Route>
      </Routes>
    </>
  );
};
