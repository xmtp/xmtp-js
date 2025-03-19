import "./Main.css";
import { Route, Routes } from "react-router";
import { SelectConversation } from "@/components/App/SelectConversation";
import { Welcome } from "@/components/App/Welcome";
import { LoadConversation } from "@/components/Conversation/LoadConversation";
import { LoadDM } from "@/components/Conversation/LoadDM";
import { LoadGroupToManage } from "@/components/Conversation/LoadGroupToManage";
import { NewConversation } from "@/components/Conversation/NewConversation";
import { Conversations } from "@/components/Conversations/Conversations";
import { Identity } from "@/components/Identity/Identity";
import { MessageModal } from "@/components/Messages/MessageModal";

export const Main: React.FC = () => (
  <Routes>
    <Route index element={<Welcome />} />
    <Route path="/dm/:address" element={<LoadDM />} />
    <Route path="conversations" element={<Conversations />}>
      <Route index element={<SelectConversation />} />
      <Route path="new" element={<NewConversation />} />
      <Route path=":conversationId" element={<LoadConversation />}>
        <Route path="message/:messageId" element={<MessageModal />} />
      </Route>
      <Route path=":conversationId/manage" element={<LoadGroupToManage />} />
    </Route>
    <Route path="identity" element={<Identity />} />
  </Routes>
);
