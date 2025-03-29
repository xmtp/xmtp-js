import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/App/AppLayout";
import { ErrorModal } from "@/components/App/ErrorModal";
import { SelectConversation } from "@/components/App/SelectConversation";
import { Welcome } from "@/components/App/Welcome";
import { WelcomeLayout } from "@/components/App/WelcomeLayout";
import { LoadConversation } from "@/components/Conversation/LoadConversation";
import { LoadDM } from "@/components/Conversation/LoadDM";
import { LoadGroupToManage } from "@/components/Conversation/LoadGroupToManage";
import { NewConversation } from "@/components/Conversation/NewConversation";
import { Identity } from "@/components/Identity/Identity";
import { MessageModal } from "@/components/Messages/MessageModal";
import { useAnalytics } from "@/hooks/useAnalytics";

export const App: React.FC = () => {
  useAnalytics();

  return (
    <>
      <ErrorModal />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/conversations" />} />
          <Route path="identity" element={<Identity />} />
          <Route path="/dm/:address" element={<LoadDM />} />
          <Route path="conversations">
            <Route index element={<SelectConversation />} />
            <Route path="new" element={<NewConversation />} />
            <Route path=":conversationId" element={<LoadConversation />}>
              <Route path="message/:messageId" element={<MessageModal />} />
            </Route>
            <Route
              path=":conversationId/manage"
              element={<LoadGroupToManage />}
            />
          </Route>
        </Route>
        <Route path="/" element={<WelcomeLayout />}>
          <Route path="welcome" element={<Welcome />} />
        </Route>
      </Routes>
    </>
  );
};
