import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://localhost:8000';


/* =========================================================
   AUTOMATIC LOGIN
   ========================================================= */

async function loginAndGetToken() {
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

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      'Authentication server returned an invalid response'
    );
  }

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.detail || 'Authentication failed'
    );
  }

  localStorage.setItem(
    'access_token',
    data.access_token
  );

  return data.access_token;
}


/* =========================================================
   AUTHENTICATED FETCH
   ========================================================= */

async function authenticatedFetch(
  url,
  options = {}
) {
  let currentToken =
    localStorage.getItem('access_token') || '';

  /*
   * No token exists.
   * Automatically log in.
   */
  if (!currentToken) {
    currentToken =
      await loginAndGetToken();
  }

  const firstHeaders = new Headers(
    options.headers || {}
  );

  firstHeaders.set(
    'Authorization',
    'Bearer ' + currentToken
  );

  let response = await fetch(url, {
    ...options,
    headers: firstHeaders
  });


  /*
   * Token expired / invalid.
   *
   * Get a fresh token and retry exactly once.
   */
  if (response.status === 401) {
    console.log(
      'JWT expired or invalid. Refreshing token...'
    );

    /*
     * Remove the old token first.
     */
    localStorage.removeItem(
      'access_token'
    );

    currentToken =
      await loginAndGetToken();

    const retryHeaders = new Headers(
      options.headers || {}
    );

    retryHeaders.set(
      'Authorization',
      'Bearer ' + currentToken
    );

    response = await fetch(url, {
      ...options,
      headers: retryHeaders
    });
  }

  return response;
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {

  const [token, setToken] = useState(
    localStorage.getItem('access_token') || ''
  );

  const [question, setQuestion] =
    useState('');

  const [answer, setAnswer] =
    useState('');

  const [sources, setSources] =
    useState([]);

  const [file, setFile] =
    useState(null);

  const [metrics, setMetrics] =
    useState(null);

  const [status, setStatus] =
    useState('');


  /* =======================================================
     MANUAL LOGIN BUTTON
     ======================================================= */

  async function login() {
    console.log(
      'LOGIN BUTTON CLICKED'
    );

    try {
      setStatus(
        'Signing in...'
      );

      const newToken =
        await loginAndGetToken();

      setToken(newToken);

      setStatus(
        '✅ Authenticated as demo admin'
      );

    } catch (error) {
      console.error(
        'LOGIN FAILED:',
        error
      );

      setStatus(
        '❌ Login failed: ' +
        error.message
      );
    }
  }


  /* =======================================================
     UPLOAD & INDEX
     ======================================================= */

  async function upload() {

    if (!file) {
      setStatus(
        '❌ Please select a document first.'
      );

      return;
    }

    try {

      setStatus(
        'Uploading and indexing...'
      );

      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );


      /*
       * authenticatedFetch automatically:
       *
       * 1. Gets token if missing
       * 2. Adds Authorization header
       * 3. Refreshes token if 401
       * 4. Retries the request
       */

      const response =
        await authenticatedFetch(
          API + '/documents/upload',
          {
            method: 'POST',
            body: formData
          }
        );


      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'Server returned an invalid response'
        );
      }


      if (!response.ok) {
        throw new Error(
          data.detail ||
          'Document upload failed'
        );
      }


      setStatus(
        '✅ Indexed ' +
        data.chunks +
        ' chunks'
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


  /* =======================================================
     ASK AI / CHAT
     ======================================================= */

  async function ask() {

    if (!question.trim()) {
      setStatus(
        '❌ Please enter a question.'
      );

      return;
    }

    try {

      setStatus(
        'Retrieving + reranking + generating...'
      );


      const response =
        await authenticatedFetch(
          API + '/chat',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              question:
                question.trim()
            })
          }
        );


      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'Server returned an invalid response'
        );
      }


      if (!response.ok) {
        throw new Error(
          data.detail ||
          'Chat request failed'
        );
      }


      setAnswer(
        data.answer || ''
      );

      setSources(
        data.sources || []
      );


      setStatus(
        (data.intent || 'RAG') +
        ' • ' +
        (data.latency_ms ?? '-') +
        ' ms • ' +
        (data.token_usage ?? '-') +
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


  /* =======================================================
     EVALUATION DASHBOARD
     ======================================================= */

  async function refreshMetrics() {

    try {

      setStatus(
        'Refreshing evaluation metrics...'
      );


      const response =
        await authenticatedFetch(
          API + '/evaluation/summary',
          {
            method: 'GET'
          }
        );


      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'Server returned an invalid response'
        );
      }


      if (!response.ok) {
        throw new Error(
          data.detail ||
          'Failed to load evaluation metrics'
        );
      }


      setMetrics(data);

      setStatus(
        '✅ Evaluation metrics refreshed'
      );

    } catch (error) {

      console.error(
        'METRICS FAILED:',
        error
      );

      setStatus(
        '❌ Metrics failed: ' +
        error.message
      );
    }
  }


  /* =========================================================
     UI
     ========================================================= */

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
            Enterprise documents → hybrid retrieval
            → reranking → grounded LLM answers.
          </p>

        </div>

        <b>
          LOCAL DEMO
        </b>

      </header>


      {/* =====================================================
          AUTHENTICATION + UPLOAD
          ===================================================== */}

      <div className="grid">

        <section>

          <h2>
            1. Authentication
          </h2>

          <button onClick={login}>
            Sign in as demo admin
          </button>

          {token && (
            <p className="status">
              ✅ Authentication token available
            </p>
          )}

        </section>


        <section>

          <h2>
            2. Knowledge ingestion
          </h2>

          <input
            type="file"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
          />

          <button onClick={upload}>
            Upload & index
          </button>

        </section>

      </div>


      {/* =====================================================
          RESEARCH ASSISTANT
          ===================================================== */}

      <section>

        <h2>
          3. Research Assistant
        </h2>

        <textarea
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }
          placeholder="Ask about your documents..."
        />

        <button onClick={ask}>
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

            {sources.map(
              (source, index) => (

                <div
                  className="source"
                  key={
                    source.citation ||
                    index
                  }
                >

                  <b>
                    [
                    {source.citation}
                    ]
                  </b>

                  {' '}

                  {source.source}

                  <span>
                    {source.score}
                  </span>

                </div>

              )
            )}

          </>
        )}

      </section>


      {/* =====================================================
          EVALUATION DASHBOARD
          ===================================================== */}

      <section>

        <div className="row">

          <h2>
            4. Evaluation Dashboard
          </h2>

          <button
            onClick={refreshMetrics}
          >
            Refresh
          </button>

        </div>


        <div className="metrics">

          {[
            'recall',
            'precision',
            'mrr',
            'ndcg',
            'faithfulness',
            'answer_relevance',
            'citation_accuracy',
            'latency_ms',
            'token_usage'
          ].map(
            (key) => (

              <div key={key}>

                <small>
                  {key}
                </small>

                <strong>
                  {
                    metrics
                      ? metrics[key]
                      : '—'
                  }
                </strong>

              </div>

            )
          )}

        </div>


        <p>
          Metrics are wired into the dashboard;
          retrieval benchmark scores should be
          populated from a labeled evaluation set.
          Faithfulness/relevance can be upgraded
          to RAGAS/LLM-as-a-judge for production
          evaluation.
        </p>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer>
        FastAPI • LangChain • PostgreSQL/pgvector
        • BM25 • Cross Encoder • Ollama • React
      </footer>

    </main>
  );
}


/* =========================================================
   REACT ENTRY POINT
   ========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);