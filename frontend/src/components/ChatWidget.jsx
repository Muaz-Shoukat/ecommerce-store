import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { sendChatMessage } from '../api/chatApi';

const PRODUCT_DETAIL_PATH = /^\/products\/([^/]+)/;

function productSlugFromPath(pathname) {
  const match = pathname.match(PRODUCT_DETAIL_PATH);
  return match?.[1] ?? null;
}

function formatError(detail) {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.toString?.() ?? d).join(' ');
  return 'Something went wrong. Please try again.';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! Ask me about pens, notebooks, or anything in our stationery catalog.',
    },
  ]);
  const listRef = useRef(null);
  const { pathname } = useLocation();
  const productSlug = productSlugFromPath(pathname);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setSending(true);

    try {
      const { reply, sources } = await sendChatMessage({
        message: trimmed,
        productSlug: productSlug ?? undefined,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, sources }]);
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const text =
        status === 503
          ? formatError(detail)
          : status === 502
            ? 'The assistant is temporarily unavailable. Please try again.'
            : formatError(detail);
      setMessages((prev) => [...prev, { role: 'assistant', text, isError: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
  <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary-700 bg-primary-700 text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          aria-label="Open store assistant"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-4 right-4 z-[60] flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-surface-elevated shadow-lift"
          role="dialog"
          aria-label="Store assistant"
        >
          <header className="flex items-center justify-between border-b border-neutral-100 bg-primary-800 px-4 py-3 text-white">
            <div>
              <p className="font-display text-base font-semibold">Store assistant</p>
              <p className="text-xs text-primary-100">
                {productSlug ? `Asking about: ${productSlug}` : 'Powered by your catalog'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-primary-100 transition hover:bg-primary-700 hover:text-white"
              aria-label="Close assistant"
            >
              <X size={20} />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface p-4"
          >
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-700 text-white'
                      : msg.isError
                        ? 'border border-error/30 bg-error/5 text-neutral-800'
                        : 'border border-neutral-200 bg-white text-neutral-800 shadow-card'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.sources?.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-xs text-neutral-600">
                      {msg.sources.map((s) => (
                        <li key={s.slug}>
                          <Link
                            to={`/products/${s.slug}`}
                            className="font-medium text-primary-700 underline-offset-2 hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {s.name}
                          </Link>
                          {s.price != null && (
                            <span className="text-neutral-500"> — Rs {s.price}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <p className="text-xs text-neutral-500" aria-live="polite">
                Thinking…
              </p>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-end gap-2 border-t border-neutral-100 bg-white p-3"
          >
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask about products…"
              maxLength={1000}
              disabled={sending}
              className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}