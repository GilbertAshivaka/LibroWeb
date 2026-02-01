import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../../api'
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react'

export default function EmbedAIPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Libro AI, your library assistant. I can help you with:\n\n• Finding books and resources\n• Library catalog searches\n• Answering questions about library services\n• Providing recommendations\n\nHow can I assist you today?",
      timestamp: new Date(),
    }])
  }, [])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      const response = await aiAPI.chat({
        message: userMessage.content,
        session_id: sessionId,
        context: {
          source: 'libro-app',
          language: navigator.language,
        },
      })
      
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'I apologize, but I could not process your request.',
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI chat error:', error)
      
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true,
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }
  
  const handleReset = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Libro AI, your library assistant. How can I help you today?",
      timestamp: new Date(),
    }])
  }
  
  return (
    <div className="h-screen flex flex-col bg-libro-cream-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-libro-warmgray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-libro-warmgray-800">Libro AI</h1>
            <p className="text-xs text-libro-warmgray-500">Your library assistant</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg transition-colors"
          title="New conversation"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-libro-coral-100 text-libro-coral-500'
                : 'bg-libro-blue-100 text-libro-blue-500'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-libro-coral-500 text-white rounded-tr-sm'
                  : message.isError
                  ? 'bg-red-50 text-red-700 rounded-tl-sm'
                  : 'bg-white text-libro-warmgray-700 shadow-sm rounded-tl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className={`text-xs text-libro-warmgray-400 mt-1 ${
                message.role === 'user' ? 'text-right' : ''
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-libro-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-libro-blue-500" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-libro-warmgray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 bg-white border-t border-libro-warmgray-100">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about the library..."
            className="flex-1 px-4 py-3 rounded-xl bg-libro-warmgray-50 border border-libro-warmgray-200 
                       focus:outline-none focus:ring-2 focus:ring-libro-coral-500 focus:border-transparent
                       text-libro-warmgray-700 placeholder-libro-warmgray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-libro-coral-500 text-white rounded-xl hover:bg-libro-coral-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-center text-libro-warmgray-400 mt-2">
          Powered by Gemini AI
        </p>
      </div>
    </div>
  )
}
