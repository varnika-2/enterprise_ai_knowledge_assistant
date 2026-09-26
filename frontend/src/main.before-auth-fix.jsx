import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('access_token') || ''
  );

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [file, setFile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('');

  // -------------------------
  // Authentication
  // -------------------------
  async function login() {
    console.log('LOGIN BUTTON CLICKED');

    try {
      setStatus('Signing in...');

      const response = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'demo@example.com',
          password: 'Demo@123'
        })
      });

      console.log('Login status:', response.status);

      const data = await response.json();

      console.log('Login response:', data);

      if (!response.ok) {
        setStatus(
          '❌ Login error: ' +
            (data.detail || 'Authentication failed')
        );
        return;
      }

      localStorage.setItem(
        'access_token',
        data.access_token
      );

      setToken(data.access_token);

      setStatus(
        '✅ Authenticated as demo admin'
      );

    } catch (error) {
      console.error('LOGIN FAILED:', error);

      setStatus(
        '❌ Login failed: ' + error.message
      );
    }
  }

  // -------------------------
  // Upload & Index
  // -------------------------
  async function upload() {
    console.log('UPLOAD BUTTON CLICKED');

    const currentToken =
      localStorage.getItem('access_token') || token;

    console.log(
      'Token exists:',
      !!currentToken
    );

    console.log(
      'Selected file:',
      file
    );

    if (!currentToken) {
      setStatus(
        '❌ Please sign in first.'
      );

      console.error(
        'UPLOAD STOPPED: No authentication token'
      );

      return;
    }

    if (!file) {
      setStatus(
        '❌ Please select a file first.'
      );

      console.error(
        'UPLOAD STOPPED: No file selected'
      );

      return;
    }

    try {
      setStatus(
        '⏳ Uploading and indexing...'
      );

      const formData = new FormData();

      formData.append(
        'file',
        file
      );

      console.log(
        'Sending POST /documents/upload'
      );

      const response = await fetch(
        API + '/documents/upload',
        {
          method: 'POST',

          headers: {
            Authorization:
              'Bearer ' + currentToken
          },

          body: formData
        }
      );

      console.log(
        'Upload HTTP status:',
        response.status
      );

      const data = await response.json();

      console.log(
        'Upload response:',
        data
      );

      if (!response.ok) {
        setStatus(
          '❌ Upload error: ' +
            (data.detail || 'Upload failed')
        );

        return;
      }

      setStatus(
        '✅ Indexed ' +
          (data.chunks || 0) +
          ' chunks successfully'
      );

    } catch (error) {
      console.error(
        'UPLOAD FAILED:',
        error
      );

      setStatus(
        '❌ Upload failed: ' +
          error.message
      );
    }
  }

  // -------------------------
  // Research Assistant
  // -------------------------
  async function ask() {
    console.log(
      'ASK AI BUTTON CLICKED'
    );

    const currentToken =
      localStorage.getItem('access_token') || token;

    if (!currentToken) {
      setStatus(
        '❌ Please sign in first.'
      );

      return;
    }

    if (!question.trim()) {
      setStatus(
        '❌ Please enter a question.'
      );

      return;
    }

    try {
      setStatus(
        '⏳ Retrieving documents...'
      );

      const response = await fetch(
        API + '/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              'Bearer ' + currentToken
          },

          body: JSON.stringify({
            question:
              question.trim()
          })
        }
      );

      console.log(
        'Chat HTTP status:',
        response.status
      );

      const data =
        await response.json();

      console.log(
        'Chat response:',
        data
      );

      if (!response.ok) {
        setStatus(
          '❌ Chat error: ' +
            (data.detail ||
              'Chat request failed')
        );

        return;
      }

      setAnswer(
        data.answer || ''
      );

      setSources(
        data.sources || []
      );

      setStatus(
        '✅ ' +
          (data.intent || 'RAG') +
          ' • ' +
          (data.latency_ms ?? '—') +
          ' ms • ' +
          (data.token_usage ?? '—') +
          ' tokens'
      );

    } catch (error) {
      console.error(
        'CHAT FAILED:',
        error
      );

      setStatus(
        '❌ Chat failed: ' +
          error.message
      );
    }
  }

  // -------------------------
  // Evaluation Dashboard
  // -------------------------
  async function refreshMetrics() {
    console.log(
      'EVALUATION REFRESH CLICKED'
    );

    const currentToken =
      localStorage.getItem('access_token') || token;

    if (!currentToken) {
      setStatus(
        '❌ Please sign in first.'
      );

      return;
    }

    try {
      setStatus(
        '⏳ Loading evaluation metrics...'
      );

      const response =
        await fetch(
          API + '/evaluation/summary',
          {
            method: 'GET',

            headers: {
              Authorization:
                'Bearer ' +
                currentToken
            }
          }
        );

      console.log(
        'Evaluation HTTP status:',
        response.status
      );

      const data =
        await response.json();

      console.log(
        'Evaluation response:',
        data
      );

      if (!response.ok) {
        setStatus(
          '❌ Evaluation error: ' +
            (data.detail ||
              'Could not load metrics')
        );

        return;
      }

      setMetrics(data);

      setStatus(
        '✅ Evaluation metrics refreshed'
      );

    } catch (error) {
      console.error(
        'EVALUATION FAILED:',
        error
      );

      setStatus(
        '❌ Evaluation failed: ' +
          error.message
      );
    }
  }

  // -------------------------
  // Logout
  // -------------------------
  function logout() {
    localStorage.removeItem(
      'access_token'
    );

    setToken('');
    setAnswer('');
    setSources([]);
    setMetrics(null);
    setQuestion('');
    setFile(null);

    setStatus(
      'Signed out'
    );
  }

  const metricNames = [
    'recall',
    'precision',
    'mrr',
    'ndcg',
    'faithfulness',
    'answer_relevance',
    'citation_accuracy',
    'latency_ms',
    'token_usage'
  ];

  // -------------------------
  // UI
  // -------------------------
  return (
    <main>

      <header>
        <div>

          <small>
            GENAI • RAG • HYBRID SEARCH • EVALUATION
          </small>

          <h1>
            Enterprise AI Knowledge Assistant
          </h1>

          <p>
            Enterprise documents → hybrid retrieval →
            reranking → grounded LLM answers.
          </p>

        </div>

        <b>
          LOCAL DEMO
        </b>
      </header>


      {/* Authentication + Upload */}

      <div className="grid">

        <section>

          <h2>
            1. Authentication
          </h2>

          {!token ? (

            <button
              onClick={login}
            >
              Sign in as demo admin
            </button>

          ) : (

            <>
              <p className="status">
                ✅ Authenticated as demo admin
              </p>

              <button
                onClick={logout}
              >
                Sign out
              </button>
            </>

          )}

        </section>


        <section>

          <h2>
            2. Knowledge ingestion
          </h2>

          <input
            type="file"
            accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.csv"
            onChange={(event) => {

              const selectedFile =
                event.target.files?.[0] ||
                null;

              console.log(
                'FILE SELECTED:',
                selectedFile
              );

              setFile(
                selectedFile
              );

              if (selectedFile) {
                setStatus(
                  '📄 Selected: ' +
                    selectedFile.name
                );
              }

            }}
          />

          {file && (
            <p>
              Selected file:{' '}
              <strong>
                {file.name}
              </strong>
            </p>
          )}

          <button
            onClick={upload}
          >
            Upload & index
          </button>

        </section>

      </div>


      {/* Research Assistant */}

      <section>

        <h2>
          3. Research Assistant
        </h2>

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          placeholder="Ask about your documents..."
        />

        <button
          onClick={ask}
          disabled={!token}
        >
          Ask AI
        </button>

        <p className="status">
          {status}
        </p>


        {answer && (

          <>

            <h3>
              Answer
            </h3>

            <p className="answer">
              {answer}
            </p>


            <h3>
              Citations
            </h3>


            {sources.length === 0 ? (

              <p>
                No citations returned.
              </p>

            ) : (

              sources.map(
                (source, index) => (

                  <div
                    className="source"
                    key={
                      source.citation ||
                      source.source ||
                      index
                    }
                  >

                    <b>
                      [
                      {source.citation ||
                        index + 1}
                      ]
                    </b>{' '}

                    {source.source ||
                      'Unknown source'}

                    {' '}

                    <span>
                      {source.score ??
                        ''}
                    </span>

                  </div>

                )
              )

            )}

          </>

        )}

      </section>


      {/* Evaluation */}

      <section>

        <div className="row">

          <h2>
            4. Evaluation Dashboard
          </h2>

          <button
            onClick={
              refreshMetrics
            }
            disabled={!token}
          >
            Refresh
          </button>

        </div>


        <div className="metrics">

          {metricNames.map(
            (name) => (

              <div
                key={name}
              >

                <small>
                  {name}
                </small>

                <strong>
                  {metrics?.[name] ??
                    '—'}
                </strong>

              </div>

            )
          )}

        </div>


        <p>
          Metrics are wired into the dashboard.
          Retrieval benchmark scores should be
          populated from a labeled evaluation set.
          Faithfulness, relevance, and citation
          accuracy can be upgraded to RAGAS or
          LLM-as-a-judge for production evaluation.
        </p>

      </section>


      <footer>
        FastAPI • LangChain • PostgreSQL/pgvector •
        BM25 • Cross Encoder • Ollama • React
      </footer>

    </main>
  );
}


createRoot(
  document.getElementById('root')
).render(
  <App />
);