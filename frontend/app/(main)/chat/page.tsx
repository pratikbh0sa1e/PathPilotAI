import ChatWindow from "@/components/chat/ChatWindow";

const DEMO_PROFILE = {
  gpa: 8.5,
  field_of_study: "Computer Science",
  target_countries: ["Germany", "Canada"],
  goals: "MS in Artificial Intelligence",
  budget_range: "limited",
};

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)] -mt-8 -mx-6">
      <ChatWindow profile={DEMO_PROFILE} sessionId="demo-session" />
    </div>
  );
}
