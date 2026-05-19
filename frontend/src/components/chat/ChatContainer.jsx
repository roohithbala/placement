import { useState, useEffect, useRef } from "react";
import { QuestionInbox } from "./QuestionInbox";
import { ChatThread } from "./ChatThread";
import { CreateQuestionFlow } from "./CreateQuestionFlow";
import { cn } from "../../lib/utils";
import { anonQuestionService, answerService, sessionService, BACKEND_BASE_URL } from "../../services/api";

const ANIMALS = ["🦊", "🐼", "🦁", "🐨", "🦉", "🐸", "🦋", "🐙", "🦜", "🐢", "🦈", "🐝"];

export const ChatContainer = ({ className }) => {
    const [view, setView] = useState("inbox");
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [sessionIcon, setSessionIcon] = useState("");
    const socketRef = useRef(null);

    useEffect(() => {
        // Generate a session icon and ID if not exists
        let icon = localStorage.getItem('anonq_session_icon');
        let sId = localStorage.getItem('anonq_session_id');

        if (!icon) {
            icon = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
            localStorage.setItem('anonq_session_icon', icon);
        }
        if (!sId) {
            sId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('anonq_session_id', sId);
        }

        setSessionIcon(icon);

        // Init session on backend
        sessionService.init({
            sessionId: sId,
            animalIcon: icon
        }).catch(err => console.error("Session init failed", err));

        fetchQuestions();

        // Setup WebSocket and dynamic fallback to HTTP polling
        const wsUrl = BACKEND_BASE_URL.startsWith('http')
            ? BACKEND_BASE_URL.replace(/^http/, 'ws')
            : `ws://localhost:5000`;

        let socket;
        let intervalId;

        const startPolling = () => {
            if (selectedQuestionId && !intervalId) {
                intervalId = setInterval(() => {
                    fetchAnswers(selectedQuestionId);
                }, 5000);
            }
        };

        try {
            socket = new WebSocket(wsUrl);
            socket.onopen = () => console.log('WebSocket Connected');
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'ANSWER_RECEIVED') {
                    const answer = data.payload;
                    if (answer.questionId === selectedQuestionId) {
                        setMessages(prev => {
                            if (prev.some(m => m._id === answer._id)) return prev;
                            return [...prev, answer];
                        });
                    }
                    setQuestions(prev => prev.map(q => {
                        const qId = q._id || q.id;
                        return (qId === answer.questionId)
                            ? { ...q, answerCount: (q.answerCount || 0) + 1 }
                            : q;
                    }));
                }
                if (data.type === 'REACTION_UPDATED') {
                    const { answerId, reactions } = data.payload;
                    setMessages(prev => prev.map(m =>
                        (m._id === answerId) ? { ...m, reactions } : m
                    ));
                }
            };
            socket.onclose = () => {
                console.log('WebSocket closed, switching to polling');
                startPolling();
            };
            socket.onerror = (err) => {
                console.warn('WebSocket error, switching to polling', err);
                startPolling();
            };
            socketRef.current = socket;
        } catch (error) {
            console.warn('WebSocket init failed, switching to polling', error);
            startPolling();
        }

        return () => {
            if (socket) socket.close();
            if (intervalId) clearInterval(intervalId);
        };
    }, [selectedQuestionId]);

    const fetchQuestions = async () => {
        try {
            const res = await anonQuestionService.getQuestions();
            setQuestions(res.data);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    const fetchAnswers = async (qId) => {
        try {
            const res = await answerService.getAnswers(qId);
            setMessages(res.data);
        } catch (error) {
            console.error("Error fetching answers:", error);
        }
    };

    const handleSelectQuestion = (id) => {
        setSelectedQuestionId(id);
        fetchAnswers(id);
        setView("thread");
    };

    const handleBack = () => {
        setView("inbox");
        setSelectedQuestionId(null);
        setMessages([]);
        fetchQuestions();
    };

    const handleCreateQuestion = () => {
        setView("create");
    };

    const handleSubmitQuestion = async (questionText) => {
        try {
            const res = await anonQuestionService.createQuestion(
                questionText,
                localStorage.getItem('anonq_session_id')
            );
            const newQuestion = res.data;
            setQuestions([newQuestion, ...questions]);
            setSelectedQuestionId(newQuestion._id);
            setMessages([]);
            setView("thread");
        } catch (error) {
            console.error("Error creating question:", error);
        }
    };

    const handleSendMessage = async (content, imageUrl) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'NEW_ANSWER',
                payload: {
                    questionId: selectedQuestionId,
                    text: content,
                    senderIcon: sessionIcon,
                    sessionId: localStorage.getItem('anonq_session_id'),
                    imageUrl
                }
            }));
        } else {
            try {
                const res = await answerService.createAnswer({
                    questionId: selectedQuestionId,
                    text: content,
                    senderIcon: sessionIcon,
                    sessionId: localStorage.getItem('anonq_session_id'),
                    imageUrl
                });
                setMessages(prev => {
                    if (prev.some(m => m._id === res.data._id)) return prev;
                    return [...prev, res.data];
                });
                setQuestions(prev => prev.map(q => {
                    const qId = q._id || q.id;
                    return (qId === selectedQuestionId)
                        ? { ...q, answerCount: (q.answerCount || 0) + 1 }
                        : q;
                }));
            } catch (error) {
                console.error("Error posting answer via HTTP:", error);
            }
        }
    };

    const handleReact = async (answerId, type) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'REACTION',
                payload: {
                    answerId,
                    reaction: type // 'helpful', 'clear', or 'smart'
                }
            }));
        } else {
            try {
                const res = await answerService.reactToAnswer(answerId, type);
                setMessages(prev => prev.map(m =>
                    (m._id === answerId) ? { ...m, reactions: res.data.reactions } : m
                ));
            } catch (error) {
                console.error("Error reacting to answer via HTTP:", error);
            }
        }
    };

    const handleArchive = async (questionId) => {
        try {
            await anonQuestionService.updateStatus(questionId, 'archived');
            setQuestions(prev => prev.map(q =>
                (q._id === questionId) ? { ...q, status: 'archived' } : q
            ));
        } catch (error) {
            console.error("Error archiving question:", error);
        }
    };

    const handleReport = (questionId) => {
        // Implementation for reporting (could be another API call)
        alert("Thank you for reporting. Our moderators will review this question shortly. 🔒");
    };

    const selectedQuestion = questions.find((q) => (q._id || q.id) === selectedQuestionId);

    return (
        <div
            className={cn(
                "w-[80vw] sm:w-[350px] h-[100dvh] sm:h-[min(600px,calc(100vh-120px))]",
                "bg-background sm:border border-border",
                "sm:rounded-2xl overflow-hidden shadow-soft",
                "flex flex-col",
                className
            )}
        >
            {view === "inbox" && (
                <QuestionInbox
                    questions={questions}
                    onSelectQuestion={handleSelectQuestion}
                    onCreateQuestion={handleCreateQuestion}
                    selectedId={selectedQuestionId}
                />
            )}

            {view === "thread" && selectedQuestion && (
                <ChatThread
                    question={selectedQuestion}
                    messages={messages.map(m => ({ ...m, isOwn: m.senderIcon === sessionIcon }))}
                    aiSummary={selectedQuestion.aiSummary ? { summary: selectedQuestion.aiSummary, keyPoints: [] } : undefined}
                    onBack={handleBack}
                    onSendMessage={handleSendMessage}
                    onReact={handleReact}
                    onArchive={() => handleArchive(selectedQuestion._id)}
                    onReport={() => handleReport(selectedQuestion._id)}
                />
            )}

            {view === "create" && (
                <CreateQuestionFlow onBack={handleBack} onSubmit={handleSubmitQuestion} />
            )}
        </div>
    );
};

export default ChatContainer;
