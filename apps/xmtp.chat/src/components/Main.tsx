import "./Main.css";
import { Route, Routes } from "react-router";
import { Conversations } from "./Conversations";
import { Identity } from "./Identity";
import { LoadConversation } from "./LoadConversation";
import { ManageConversation } from "./ManageConversation";
import { MessageModal } from "./MessageModal";
import { NewConversation } from "./NewConversation";
import { SelectConversation } from "./SelectConversation";
import { Welcome } from "./Welcome";

export const Main: React.FC = () => (
  <Routes>
    <Route index element={<Welcome />} />
    <Route path="conversations" element={<Conversations />}>
      <Route index element={<SelectConversation />} />
      <Route path="new" element={<NewConversation />} />
      <Route path=":conversationId" element={<LoadConversation />}>
        <Route path="message/:messageId" element={<MessageModal />} />
      </Route>
      <Route path=":conversationId/manage" element={<ManageConversation />} />
    </Route>
    <Route path="identity" element={<Identity />} />
  </Routes>
);
