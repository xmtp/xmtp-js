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
import { ManageMetadataModal } from "@/components/Conversation/ManageMetadataModal";
import { ManagePermissionsModal } from "@/components/Conversation/ManagePermissionsModal";
import { CreateDmModal } from "@/components/Conversations/CreateDmModal";
import { CreateGroupModal } from "@/components/Conversations/CreateGroupModal";
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
            <Route path="new-dm" element={<CreateDmModal />} />
            <Route path="new-group" element={<CreateGroupModal />} />
            <Route path="identity" element={<IdentityModal />} />
            <Route path=":conversationId" element={<LoadConversation />}>
              <Route path="new-dm" element={<CreateDmModal />} />
              <Route path="new-group" element={<CreateGroupModal />} />
              <Route path="identity" element={<IdentityModal />} />
              <Route path="message/:messageId" element={<MessageModal />} />
              <Route path="manage">
                <Route path="consent" element={<ManageConsentModal />} />
                <Route path="members" element={<ManageMembersModal />} />
                <Route
                  path="permissions"
                  element={<ManagePermissionsModal />}
                />
                <Route path="metadata" element={<ManageMetadataModal />} />
              </Route>
            </Route>
          </Route>
          <Route path="disconnect" element={<Disconnect />} />
        </Route>
      </Routes>
    </>
  );
};
