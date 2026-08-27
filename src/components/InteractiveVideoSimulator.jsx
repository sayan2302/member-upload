import { useState, useEffect, useRef } from 'react'
import {
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  MousePointerIcon,
  DownloadIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UploadCloudIcon,
  LockIcon,
  ExcelFileIcon,
  MaximizeIcon
} from './Icons.jsx'

export function InteractiveVideoSimulator({ 
  role = 'hr', 
  onOpenFullscreen, 
  compact = false 
}) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackTime, setPlaybackTime] = useState(0) // 0 to 16 seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x or 1.5x
  const [activeRoleTab, setActiveRoleTab] = useState(role === 'broker' ? 'broker' : 'hr')

  const TOTAL_DURATION = 16 // 16s total (4s per scene)

  useEffect(() => {
    setActiveRoleTab(role === 'broker' ? 'broker' : 'hr')
    setPlaybackTime(0)
    setIsPlaying(true)
  }, [role])

  // Continuous animation timer (40ms = 25fps)
  useEffect(() => {
    if (!isPlaying) return

    const interval = 40
    const timer = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + (interval / 1000) * playbackSpeed
        if (next >= TOTAL_DURATION) return 0
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, playbackSpeed])

  const currentSceneIndex = Math.min(3, Math.floor(playbackTime / 4))
  const sceneProgress = (playbackTime % 4) / 4 // 0.0 to 1.0 within the scene

  // Calculate live virtual mouse cursor coordinates (in % of stage width & height)
  const getCursorInfo = () => {
    if (activeRoleTab === 'hr') {
      switch (currentSceneIndex) {
        case 0: // Download Template
          if (sceneProgress < 0.35) {
            const p = sceneProgress / 0.35
            return { x: 15 + p * (76 - 15), y: 20 + p * (48 - 20), action: 'Moving to Download', clicking: false }
          } else if (sceneProgress < 0.65) {
            return { x: 76, y: 48, action: 'Clicking Download', clicking: true }
          } else {
            const p = (sceneProgress - 0.65) / 0.35
            return { x: 76 - p * 30, y: 48 + p * 30, action: 'Template Downloaded ✓', clicking: false }
          }
        case 1: // Family Hierarchy
          if (sceneProgress < 0.4) {
            const p = sceneProgress / 0.4
            return { x: 20 + p * 30, y: 42, action: 'Checking Primary Self', clicking: false }
          } else if (sceneProgress < 0.75) {
            const p = (sceneProgress - 0.4) / 0.35
            return { x: 25 + p * 35, y: 64, action: 'Linking Dependent (Jane)', clicking: true }
          } else {
            return { x: 60, y: 64, action: 'Hierarchy Linked ✓', clicking: false }
          }
        case 2: // Error Fix
          if (sceneProgress < 0.3) {
            const p = sceneProgress / 0.3
            return { x: 20 + p * (58 - 20), y: 25 + p * (56 - 25), action: 'Targeting Error Cell', clicking: false }
          } else if (sceneProgress < 0.65) {
            return { x: 58, y: 56, action: 'Clicking Cell Error', clicking: true }
          } else {
            return { x: 58, y: 56, action: 'Auto-Correcting Date ✓', clicking: false }
          }
        case 3: // Submit
          if (sceneProgress < 0.4) {
            const p = sceneProgress / 0.4
            return { x: 30 + p * 20, y: 30 + p * 35, action: 'Verifying 100% Valid', clicking: false }
          } else if (sceneProgress < 0.75) {
            return { x: 50, y: 65, action: 'Submitting to Broker', clicking: true }
          } else {
            return { x: 50, y: 65, action: 'Submitted to Broker ✓', clicking: false }
          }
        default:
          return { x: 50, y: 50, action: '', clicking: false }
      }
    } else {
      // Broker Storyboard
      switch (currentSceneIndex) {
        case 0: // Lock
          if (sceneProgress < 0.4) {
            const p = sceneProgress / 0.4
            return { x: 18 + p * (74 - 18), y: 20 + p * (48 - 20), action: 'Moving to Lock', clicking: false }
          } else {
            return { x: 74, y: 48, action: 'Claiming Exclusive Lock', clicking: sceneProgress < 0.75 }
          }
        case 1: // 61 Column Expansion
          return { x: 30 + sceneProgress * 35, y: 50, action: 'Viewing 61 Columns', clicking: false }
        case 2: // Upload Revised
          return { x: 50, y: 55, action: 'Streaming Progress...', clicking: false }
        case 3: // Approve & Commit
          if (sceneProgress < 0.4) {
            const p = sceneProgress / 0.4
            return { x: 30 + p * 20, y: 30 + p * 35, action: 'Reviewing Underwriting', clicking: false }
          } else {
            return { x: 50, y: 65, action: 'Approving to Database ✓', clicking: sceneProgress < 0.8 }
          }
        default:
          return { x: 50, y: 50, action: '', clicking: false }
      }
    }
  }

  const cursorInfo = getCursorInfo()

  const hrScenes = [
    {
      id: 0,
      badge: 'Step 1',
      title: 'Download 33-Col Template',
      desc: 'Download standard template with approved corporate columns.',
      icon: <DownloadIcon size={16} />
    },
    {
      id: 1,
      badge: 'Step 2',
      title: 'Family Hierarchy & Linking',
      desc: 'Primary Self with dependents sharing exact Employee ID.',
      icon: <CheckCircleIcon size={16} />
    },
    {
      id: 2,
      badge: 'Step 3',
      title: 'Realtime Error Tooltip Fix',
      desc: 'Click red cells to view instant validation error tooltips.',
      icon: <AlertTriangleIcon size={16} />
    },
    {
      id: 3,
      badge: 'Step 4',
      title: 'Hand-off to Broker',
      desc: '100% accepted batch sent to broker queue for underwriting.',
      icon: <UploadCloudIcon size={16} />
    }
  ]

  const brokerScenes = [
    {
      id: 0,
      badge: 'Step 1',
      title: 'Claim Exclusive Lock',
      desc: 'Click Download & Lock to lock submission exclusively.',
      icon: <LockIcon size={16} />
    },
    {
      id: 1,
      badge: 'Step 2',
      title: '61-Column Expansion',
      desc: '33 base columns + 28 underwriting columns auto-expanded.',
      icon: <ExcelFileIcon size={16} />
    },
    {
      id: 2,
      badge: 'Step 3',
      title: 'Upload Revised File',
      desc: 'Ingest updated underwriting sheet with SSE live progress.',
      icon: <UploadCloudIcon size={16} />
    },
    {
      id: 3,
      badge: 'Step 4',
      title: 'Database Finalization',
      desc: 'Review 61-column preview and commit enrolled members to DB.',
      icon: <CheckCircleIcon size={16} />
    }
  ]

  const scenes = activeRoleTab === 'hr' ? hrScenes : brokerScenes

  const formatTime = (seconds) => {
    const s = Math.floor(seconds)
    return `00:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className={`video-player-container ${compact ? 'is-compact' : ''}`}>
      {/* Video Player Chrome Top Bar */}
      <div className="video-player-top">
        <div className="video-meta-left">
          <span className="video-rec-dot" />
          <span className="video-badge-pill">DYNAMIC VIDEO DEMO</span>
          <span className="video-title-text">
            {activeRoleTab === 'hr' 
              ? 'HR Administrator: Step-by-Step Enrollment & Validation' 
              : 'Broker Underwriter: Locking, 61-Col Expansion & Approval'}
          </span>
        </div>

        <div className="video-meta-right">
          <div className="v-role-toggle-pill">
            <button
              type="button"
              className={`v-role-pill-btn ${activeRoleTab === 'hr' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveRoleTab('hr')
                setPlaybackTime(0)
                setIsPlaying(true)
              }}
            >
              🏢 HR Mode
            </button>
            <button
              type="button"
              className={`v-role-pill-btn ${activeRoleTab === 'broker' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveRoleTab('broker')
                setPlaybackTime(0)
                setIsPlaying(true)
              }}
            >
              💼 Broker Mode
            </button>
          </div>

          <button
            type="button"
            className="video-speed-btn"
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.5 : 1))}
            title="Toggle playback speed"
          >
            {playbackSpeed}x Speed
          </button>

          <div className="video-time-counter">
            <strong>{formatTime(playbackTime)}</strong> / {formatTime(TOTAL_DURATION)}
          </div>

          {onOpenFullscreen && (
            <button
              type="button"
              className="v-fullscreen-trigger-btn"
              onClick={onOpenFullscreen}
              title="Open full-screen guide modal"
            >
              <MaximizeIcon size={14} />
              <span>Full Screen</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Player Stage */}
      <div className="video-screen-stage">
        {/* Animated Window Title Bar */}
        <div className="v-window-bar">
          <div className="v-window-dots">
            <span className="w-dot red" />
            <span className="w-dot yellow" />
            <span className="w-dot green" />
          </div>
          <span className="v-window-title">
            Mayfair Member Portal — {activeRoleTab === 'hr' ? 'HR Enrollment Simulator' : 'Broker Underwriting Simulator'}
          </span>
          <span className="v-live-tag">LIVE DEMO</span>
        </div>

        {/* Virtual Cursor Overlay */}
        <div
          className={`virtual-mouse-cursor ${cursorInfo.clicking ? 'is-clicking' : ''}`}
          style={{
            left: `${cursorInfo.x}%`,
            top: `${cursorInfo.y}%`,
          }}
        >
          <MousePointerIcon size={22} />
          <span className="cursor-label">{cursorInfo.action}</span>
          {cursorInfo.clicking && <span className="cursor-click-ripple" />}
        </div>

        {/* Dynamic Storyboard Scenes */}
        {activeRoleTab === 'hr' ? (
          /* ── HR Storyboard Scenes ────────────────────────────── */
          currentSceneIndex === 0 ? (
            /* Scene 1: Template Download */
            <div className="v-scene is-fade-in" key="hr-scene-0">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 1 of 4: Template Download</div>
                <h4>Downloading the Standard 33-Column Template</h4>
              </div>

              <div className="v-mock-card">
                <div className="v-card-inner-top">
                  <div className="v-excel-badge">
                    <div className="v-excel-icon-bubble">
                      <ExcelFileIcon size={32} />
                    </div>
                    <div>
                      <strong>Mayfair_HR_Template_v2.xlsx</strong>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        33 Pre-configured Insurer Headers
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`v-action-btn is-download ${
                      sceneProgress > 0.4 ? 'is-clicked' : ''
                    }`}
                  >
                    <DownloadIcon size={15} />
                    <span>
                      {sceneProgress > 0.4 ? 'Downloaded ✓' : 'Download Template'}
                    </span>
                  </button>
                </div>

                {sceneProgress > 0.45 && (
                  <div className="v-download-tray-toast">
                    <span className="tray-icon">⬇️</span>
                    <span>
                      File saved to downloads: <strong>Mayfair_HR_Template.xlsx</strong> (24 KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : currentSceneIndex === 1 ? (
            /* Scene 2: Family Linking */
            <div className="v-scene is-fade-in" key="hr-scene-1">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 2 of 4: Family Hierarchy</div>
                <h4>Linking Dependents via Shared Primary Employee ID</h4>
              </div>

              <div className="v-table-wrap">
                <table className="v-sim-table">
                  <thead>
                    <tr>
                      <th>Employee ID *</th>
                      <th>Member Name *</th>
                      <th>Relationship *</th>
                      <th>DOB *</th>
                      <th>Sum Insured *</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="v-row-primary">
                      <td><code>EMP2045</code></td>
                      <td><strong>John Doe</strong></td>
                      <td><span className="v-badge is-self">Self</span></td>
                      <td>15/08/1990</td>
                      <td>₹5,00,000</td>
                      <td><span className="v-status is-ok">✓ Primary Self</span></td>
                    </tr>
                    <tr
                      className={`v-row-dependent ${
                        sceneProgress > 0.4 ? 'is-linked-glow' : ''
                      }`}
                    >
                      <td className="v-linked-cell">
                        <code>EMP2045</code>
                        <span className="v-link-line">↳ Linked</span>
                      </td>
                      <td><strong>Jane Doe</strong></td>
                      <td><span className="v-badge is-dep">Spouse</span></td>
                      <td>22/11/1992</td>
                      <td>₹5,00,000</td>
                      <td>
                        <span className="v-status is-ok">
                          {sceneProgress > 0.4 ? '✓ Linked to EMP2045' : 'Binding...'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentSceneIndex === 2 ? (
            /* Scene 3: Live Cell Error & Tooltip */
            <div className="v-scene is-fade-in" key="hr-scene-2">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 3 of 4: Error Resolution</div>
                <h4>Click Red Error Cells to Inspect Tooltips &amp; Fix</h4>
              </div>

              <div className="v-table-wrap">
                <table className="v-sim-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Employee ID</th>
                      <th>Member Name</th>
                      <th>Date of Birth</th>
                      <th>Sum Insured</th>
                      <th>Validation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td><code>EMP1001</code></td>
                      <td>Amit Sharma</td>
                      <td>12/04/1988</td>
                      <td>₹5,00,000</td>
                      <td><span className="v-status is-ok">✓ Valid</span></td>
                    </tr>
                    <tr className="v-error-row">
                      <td>2</td>
                      <td><code>EMP1002</code></td>
                      <td>Priya Singh</td>
                      <td
                        className={`v-error-cell ${
                          sceneProgress > 0.65 ? 'is-fixed' : 'has-error'
                        }`}
                      >
                        {sceneProgress > 0.65 ? '15/02/1995 ✓' : '31/02/1995 ⚠️'}
                        {sceneProgress > 0.25 && sceneProgress < 0.65 && (
                          <div className="v-live-tooltip-bubble">
                            <div className="v-tip-title">⚠️ Invalid Date of Birth</div>
                            <div className="v-tip-text">
                              31st February does not exist. Format as DD/MM/YYYY.
                            </div>
                          </div>
                        )}
                      </td>
                      <td>₹5,00,000</td>
                      <td>
                        {sceneProgress > 0.65 ? (
                          <span className="v-status is-ok">✓ Error Resolved</span>
                        ) : (
                          <span className="v-status is-err">✗ 1 Cell Error</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Scene 4: Hand-off & Live Transmission */
            <div className="v-scene is-fade-in" key="hr-scene-3">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 4 of 4: Hand-off to Broker</div>
                <h4>100% Validated Batch Transmitted to Underwriting Queue</h4>
              </div>

              <div className="v-submission-card">
                <div className="v-kpi-bar">
                  <div className="v-kpi-item is-tot">TOTAL: <strong>45 Members</strong></div>
                  <div className="v-kpi-item is-acc">ACCEPTED: <strong>45 (100%)</strong></div>
                  <div className="v-kpi-item is-err-zero">ERRORS: <strong>0</strong></div>
                </div>

                <div className="v-sub-status-box">
                  <div className="v-check-icon">✓</div>
                  <div>
                    <strong>Batch Submitted Successfully</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Status: 🟡 Pending Review (Broker Queue Notified)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* ── Broker Storyboard Scenes ────────────────────────── */
          currentSceneIndex === 0 ? (
            /* Broker Scene 1: Claiming & Locking */
            <div className="v-scene is-fade-in" key="broker-scene-0">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 1 of 4: Exclusive Claim &amp; Lock</div>
                <h4>Claiming HR Submission to Prevent Overwrites</h4>
              </div>

              <div className="v-mock-card">
                <div className="v-card-inner-top">
                  <div>
                    <strong>Client_Enrollment_Aug26.xlsx</strong>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Corporate: Mayfair Health • 120 Members
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`v-action-btn is-lock ${
                      sceneProgress > 0.4 ? 'is-locked' : ''
                    }`}
                  >
                    <LockIcon size={15} />
                    <span>{sceneProgress > 0.4 ? 'Locked by You 🔒' : 'Download & Lock'}</span>
                  </button>
                </div>

                {sceneProgress > 0.45 && (
                  <div className="v-lock-toast">
                    <span>🔒 Exclusive Lock Assigned: Other team brokers see row as "Locked".</span>
                  </div>
                )}
              </div>
            </div>
          ) : currentSceneIndex === 1 ? (
            /* Broker Scene 2: 61-Column Expansion */
            <div className="v-scene is-fade-in" key="broker-scene-1">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 2 of 4: Schema Expansion</div>
                <h4>33 Base HR Columns + 28 Insurer Underwriting Columns = 61 Columns</h4>
              </div>

              <div className="v-table-wrap">
                <table className="v-sim-table">
                  <thead>
                    <tr style={{ background: '#ede9fe' }}>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Sum Insured</th>
                      <th style={{ color: '#6d28d9', background: '#ddd6fe' }}>TPA Member ID</th>
                      <th style={{ color: '#6d28d9', background: '#ddd6fe' }}>Policy Number</th>
                      <th style={{ color: '#6d28d9', background: '#ddd6fe' }}>Endorsement No</th>
                      <th style={{ color: '#6d28d9', background: '#ddd6fe' }}>Net Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>EMP1001</code></td>
                      <td>John Doe</td>
                      <td>₹5,00,000</td>
                      <td className="v-uw-cell"><code>TPA-99201</code></td>
                      <td className="v-uw-cell"><code>POL-2026-MF</code></td>
                      <td className="v-uw-cell"><code>END-001</code></td>
                      <td className="v-uw-cell">₹4,520</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentSceneIndex === 2 ? (
            /* Broker Scene 3: Revised File Ingestion */
            <div className="v-scene is-fade-in" key="broker-scene-2">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 3 of 4: SSE Streaming Ingestion</div>
                <h4>Uploading Revised 61-Column Underwriting Sheet</h4>
              </div>

              <div className="v-upload-sim-box">
                <div className="v-up-title">
                  <UploadCloudIcon size={24} />
                  <span>Streaming Ingestion &amp; Validation Engine...</span>
                </div>
                <div className="v-progress-track">
                  <div
                    className="v-progress-bar"
                    style={{ width: `${Math.min(100, Math.floor(sceneProgress * 120))}%` }}
                  />
                </div>
                <div className="v-progress-meta">
                  <span>{sceneProgress > 0.8 ? 'Ingestion Complete ✓' : 'Processing rows...'}</span>
                  <span>120 / 120 Valid Rows</span>
                </div>
              </div>
            </div>
          ) : (
            /* Broker Scene 4: Database Finalization */
            <div className="v-scene is-fade-in" key="broker-scene-3">
              <div className="v-scene-header">
                <div className="v-scene-tag">Step 4 of 4: Database Finalization</div>
                <h4>Committing Approved Records to Live Database</h4>
              </div>

              <div className="v-submission-card is-broker-approved">
                <div className="v-check-icon is-broker">✓</div>
                <h3>All 120 Member Records Verified</h3>
                <p>Underwriting parameters, TPA IDs, and premium tiers confirmed.</p>

                <button
                  type="button"
                  className={`v-action-btn is-approve ${
                    sceneProgress > 0.4 ? 'is-done' : ''
                  }`}
                >
                  <span>{sceneProgress > 0.4 ? 'Enrolled in Database ✓' : 'Approve & Save to Database'}</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Video Player Interactive Scrub Timeline Bar */}
      <div className="video-player-controls">
        <div className="v-controls-left">
          <button
            type="button"
            className="v-btn-play-pause"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pause simulation' : 'Play simulation'}
          >
            {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </button>

          <button
            type="button"
            className="v-btn-replay"
            onClick={() => {
              setPlaybackTime(0)
              setIsPlaying(true)
            }}
            title="Replay from start"
          >
            <RotateCcwIcon size={14} />
          </button>
        </div>

        {/* Multi-Segment Step Scrubber */}
        <div className="v-scrubber-track">
          {scenes.map((s, idx) => {
            const isCurrent = currentSceneIndex === idx
            const isPast = currentSceneIndex > idx
            const segProgress = isCurrent ? sceneProgress : isPast ? 1 : 0

            return (
              <div
                key={s.id}
                className={`v-scrub-segment ${isCurrent ? 'is-active' : ''}`}
                onClick={() => {
                  setPlaybackTime(idx * 4)
                  setIsPlaying(true)
                }}
                title={`Jump to ${s.title}`}
              >
                <div
                  className="v-scrub-fill"
                  style={{ width: `${segProgress * 100}%` }}
                />
                <span className="v-seg-label">
                  <strong>{s.badge}:</strong> {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
