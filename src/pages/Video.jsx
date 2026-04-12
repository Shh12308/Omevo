<>
  Convert to react whole page
  <meta charSet="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <meta
    name="description"
    content="Omevo - Next Generation Video Chat Platform"
  />
  <meta name="theme-color" content="#0f172a" />
  <title>Omevo - Next Generation Video Chat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="index.css" />
  {/* Loading Screen */}
  <div id="loadingScreen" role="status" aria-live="polite">
    <div className="loading-spinner" />
    <div className="loading-text">Loading Omevo...</div>
  </div>
  {/* Ban Overlay */}
  <div
    id="banOverlay"
    role="alertdialog"
    aria-labelledby="banTitle"
    aria-describedby="banDesc"
  >
    <div className="ban-bg-noise" />
    <div className="ban-scanline" />
    <div className="ban-container">
      <div className="ban-stamp" id="banTitle">
        BANNED
      </div>
      <div className="ban-reason-frame">
        <div className="ban-reason-label">Reason for Suspension</div>
        <div className="ban-reason-icon">
          <i
            className="fas fa-exclamation-triangle"
            style={{ color: "var(--danger)" }}
          />
        </div>
        <div className="ban-reason-text" id="banReasonText">
          Your account has been suspended due to a violation of our community
          guidelines.
        </div>
        <div
          className="ban-duration"
          id="banDuration"
          style={{ display: "none" }}
        >
          <i className="fas fa-clock" />
          <span id="banDurationText" />
        </div>
      </div>
      <div className="ban-price-card">
        <div className="ban-price-label">Removal Fee</div>
        <div className="ban-price-amount">£4.99</div>
        <div className="ban-price-sub">One-time payment · Instant removal</div>
      </div>
      <div className="crypto-icons" aria-label="Accepted Cryptocurrencies">
        <div className="crypto-icon btc" title="Bitcoin">
          BTC
        </div>
        <div className="crypto-icon eth" title="Ethereum">
          ETH
        </div>
        <div className="crypto-icon ltc" title="Litecoin">
          LTC
        </div>
        <div className="crypto-icon usdc" title="USDC">
          USDC
        </div>
        <div className="crypto-icon dai" title="DAI">
          DAI
        </div>
        <div className="crypto-icon more" title="More">
          +5
        </div>
      </div>
      <div className="crypto-label">Pay securely via Coinbase Commerce</div>
      <button
        className="ban-pay-btn"
        id="banPayBtn"
        onclick="initiateUnbanPayment()"
      >
        <i className="fas fa-shield-alt btn-icon" /> Pay £4.99 to Unban
      </button>
      <div className="ban-appeal">
        <button className="ban-appeal-btn" onclick="openAppealModal()">
          <i className="fas fa-gavel" /> Submit an Appeal Instead
        </button>
      </div>
    </div>
  </div>
  {/* Appeal Modal */}
  <div
    className="appeal-modal"
    id="appealModal"
    role="dialog"
    aria-labelledby="appealTitle"
  >
    <div className="appeal-content">
      <h3 id="appealTitle">Submit Appeal</h3>
      <p>
        Explain why you believe this ban was issued in error. Appeals are
        reviewed within 48 hours.
      </p>
      <label htmlFor="appealText" style={{ display: "none" }}>
        Appeal Message
      </label>
      <textarea
        className="appeal-textarea"
        id="appealText"
        placeholder="Describe your situation... (min 10 characters)"
        maxLength={500}
        aria-required="true"
        defaultValue={""}
      />
      <div style={{ textAlign: "right", marginTop: 4 }}>
        <span
          style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
          id="appealCharCount"
        >
          0 / 500
        </span>
      </div>
      <div className="appeal-actions">
        <button
          className="btn"
          style={{ background: "var(--dark)", color: "var(--text)" }}
          onclick="closeAppealModal()"
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          id="appealSubmitBtn"
          onclick="submitAppeal()"
        >
          Submit Appeal
        </button>
      </div>
    </div>
  </div>
  {/* Age Verify Modal */}
  <div
    className="age-verify-modal"
    id="ageVerifyModal"
    role="dialog"
    aria-labelledby="ageVerifyTitle"
  >
    <div className="age-verify-content">
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>
        <i className="fas fa-id-card" style={{ color: "var(--success)" }} />
      </div>
      <h3 id="ageVerifyTitle">Age Verification</h3>
      <p>
        You must be at least 18 years old to use video chat features. Please
        confirm your date of birth.
      </p>
      <div className="age-input-group">
        <input
          type="number"
          className="age-input"
          id="ageDayInput"
          placeholder="DD"
          min={1}
          max={31}
          aria-label="Day"
        />
        <input
          type="number"
          className="age-input"
          id="ageMonthInput"
          placeholder="MM"
          min={1}
          max={12}
          aria-label="Month"
        />
        <input
          type="number"
          className="age-input"
          id="ageYearInput"
          placeholder="YYYY"
          min={1920}
          max={2010}
          aria-label="Year"
        />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          className="btn"
          style={{ background: "var(--dark)", color: "var(--text)" }}
          onclick="closeAgeVerifyModal()"
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          id="ageVerifyBtn"
          onclick="verifyAge()"
        >
          Verify Age
        </button>
      </div>
    </div>
  </div>
  {/* Unban Success Overlay */}
  <div id="unbanSuccessOverlay" role="status">
    <div className="success-check">
      <i className="fas fa-check" />
    </div>
    <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 10 }}>
      Account Restored
    </h2>
    <p
      style={{ color: "var(--text-dim)", marginBottom: 30, fontSize: "1.1rem" }}
    >
      Your suspension has been lifted. Welcome back!
    </p>
    <button
      className="btn btn-primary"
      onclick="closeUnbanSuccess()"
      style={{ padding: "14px 40px", fontSize: "1.1rem" }}
    >
      Continue to Omevo
    </button>
  </div>
  {/* Permission Overlay */}
  <div
    id="permissionOverlay"
    className="hidden"
    role="dialog"
    aria-labelledby="permTitle"
  >
    <div className="permission-card">
      <div className="permission-icon">
        <i className="fas fa-video" />
      </div>
      <h2 className="permission-title" id="permTitle">
        Camera &amp; Microphone Required
      </h2>
      <p className="permission-description">
        Omevo needs access to your camera and microphone to connect you with
        others through video chat. Your privacy is important to us.
      </p>
      <div className="permission-features">
        <div className="permission-feature">
          <i className="fas fa-check-circle" />
          <div className="permission-feature-text">HD Video Quality</div>
        </div>
        <div className="permission-feature">
          <i className="fas fa-check-circle" />
          <div className="permission-feature-text">Clear Audio</div>
        </div>
        <div className="permission-feature">
          <i className="fas fa-check-circle" />
          <div className="permission-feature-text">Privacy Protected</div>
        </div>
        <div className="permission-feature">
          <i className="fas fa-check-circle" />
          <div className="permission-feature-text">Safe &amp; Secure</div>
        </div>
      </div>
      <div className="permission-buttons">
        <button
          className="permission-btn secondary"
          onclick="denyPermissions()"
        >
          Maybe Later
        </button>
        <button
          className="permission-btn primary"
          onclick="requestPermissions()"
        >
          Allow Access
        </button>
      </div>
    </div>
  </div>
  <canvas id="bgCanvas" aria-hidden="true" />
  {/* Main App */}
  <div id="app">
    <div className="video-container" id="videoContainer">
      <div id="remoteVideoWrapper">
        <video id="remoteVideo" autoPlay="" playsInline="" />
      </div>
      <div id="blurOverlay">
        <div className="matching-content" style={{ textAlign: "center" }}>
          <div className="pulse-animation">
            <i
              className="fas fa-search"
              style={{ fontSize: "3rem", color: "white" }}
            />
          </div>
          <div className="matching-text">Finding someone to chat with...</div>
          <div className="matching-subtext">
            This usually takes less than 10 seconds
          </div>
          <div className="spinner" />
          <button className="cancel-btn" onclick="stopMatching()">
            Cancel Search
          </button>
        </div>
      </div>
      <div id="localVideoWrapper">
        <div id="localVideo" style={{ width: "100%", height: "100%" }} />
        <button
          id="pipBtn"
          title="Picture in Picture"
          aria-label="Toggle Picture in Picture"
        >
          <i className="fas fa-external-link-alt" />
        </button>
        <button
          id="resetPositionBtn"
          title="Reset Position"
          aria-label="Reset Video Position"
        >
          <i className="fas fa-compress" />
        </button>
      </div>
      <div id="partnerInfo">
        <div className="name">
          <span id="partnerName">Stranger</span>
          <span className="badge">
            <i className="fas fa-check-circle" /> Verified
          </span>
        </div>
        <div className="details">
          <div>
            <i className="fas fa-map-marker-alt" />{" "}
            <span id="partnerLocation">Unknown</span>
          </div>
          <div>
            <i className="fas fa-venus-mars" />{" "}
            <span id="partnerGender">Unknown</span>
          </div>
        </div>
        <div className="interests" id="partnerInterestsList" />
      </div>
      <div id="statsBar">
        <div className="stat-item">
          <div className="stat-value" id="matchCount">
            0
          </div>
          <div className="stat-label">Matches</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" id="timeCount">
            0:00
          </div>
          <div className="stat-label">Time</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" id="levelCount">
            1
          </div>
          <div className="stat-label">Level</div>
        </div>
        <div className="stat-item" style={{ position: "relative" }}>
          <div className="stat-label">Signal</div>
          <div
            className="network-quality excellent"
            id="networkQuality"
            title="Network Quality"
          >
            <div className="network-bar" />
            <div className="network-bar" />
            <div className="network-bar" />
          </div>
        </div>
      </div>
      <div id="controls" role="toolbar" aria-label="Video Call Controls">
        <div id="startControls" style={{ display: "flex", gap: 8 }}>
          <button
            className="control-btn primary"
            id="startBtn"
            title="Start Chatting"
            aria-label="Start Chatting"
          >
            <i className="fas fa-play" />
          </button>
          <button
            className="control-btn"
            id="giftsBtn"
            title="Send Gift"
            aria-label="Send Gift"
          >
            <i className="fas fa-gift" />
          </button>
          <button
            className="control-btn"
            id="effectsBtn"
            title="Video Effects"
            aria-label="Video Effects"
          >
            <i className="fas fa-magic" />
          </button>
        </div>
        <div id="activeControls" style={{ display: "none", gap: 8 }}>
          <button
            className="control-btn"
            id="nextBtn"
            title="Next (Skip)"
            aria-label="Next Partner"
          >
            <i className="fas fa-forward" />
          </button>
          <button
            className="control-btn"
            id="chatBtn"
            title="Chat"
            aria-label="Open Chat"
          >
            <i className="fas fa-comment" />
          </button>
          <button
            className="control-btn"
            id="screenShareBtn"
            title="Share Screen"
            aria-label="Share Screen"
          >
            <i className="fas fa-desktop" />
          </button>
          <button
            className="control-btn"
            id="reportBtn"
            title="Report"
            aria-label="Report User"
          >
            <i className="fas fa-flag" />
          </button>
          <button
            className="control-btn"
            id="likeBtn"
            title="Like"
            aria-label="Like User"
          >
            <i className="fas fa-heart" />
          </button>
          <button
            className="control-btn danger"
            id="stopBtn"
            title="Stop"
            aria-label="Stop Call"
          >
            <i className="fas fa-stop" />
          </button>
          <button
            className="control-btn"
            id="cameraBtn"
            title="Switch Camera"
            aria-label="Switch Camera"
          >
            <i className="fas fa-camera" />
          </button>
          <button
            className="control-btn"
            id="layoutBtn"
            title="Change Layout"
            aria-label="Change Layout"
          >
            <i className="fas fa-columns" />
          </button>
        </div>
      </div>
      <div className="effects-panel" id="effectsPanel" role="menu">
        <button className="effect-btn" data-effect="none" title="No Effect">
          <i className="fas fa-ban" />
        </button>
        <button className="effect-btn" data-effect="blur" title="Blur">
          <i className="fas fa-eye-slash" />
        </button>
        <button className="effect-btn" data-effect="grayscale" title="B&W">
          <i className="fas fa-adjust" />
        </button>
        <button className="effect-btn" data-effect="sepia" title="Sepia">
          <i className="fas fa-image" />
        </button>
        <button className="effect-btn" data-effect="invert" title="Invert">
          <i className="fas fa-exchange-alt" />
        </button>
        <button
          className="effect-btn"
          data-effect="contrast"
          title="High Contrast"
        >
          <i className="fas fa-sun" />
        </button>
      </div>
    </div>
  </div>
  {/* Settings Panel */}
  <div
    className="side-panel left"
    id="settingsPanel"
    role="dialog"
    aria-label="Settings"
  >
    <div className="panel-header">
      <h2>Settings</h2>
      <button
        className="control-btn"
        onclick="toggleSettings()"
        aria-label="Close Settings"
      >
        <i className="fas fa-times" />
      </button>
    </div>
    <div className="panel-content">
      <div className="form-group">
        <label htmlFor="genderSelect">I am</label>
        <select className="form-control" id="genderSelect">
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="lookingForSelect">Looking for</label>
        <select className="form-control" id="lookingForSelect">
          <option value="any">Anyone</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="locationSelect">Location</label>
        <select className="form-control" id="locationSelect">
          <option value="any">Anywhere</option>
          <option value="nearby">Nearby</option>
          <option value="us">United States</option>
          <option value="europe">Europe</option>
          <option value="asia">Asia</option>
          <option value="uk">United Kingdom</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="interestsInput">
          Interests (comma separated, max 5)
        </label>
        <input
          type="text"
          className="form-control"
          id="interestsInput"
          placeholder="Music, Gaming, Sports..."
        />
      </div>
      <button
        className="btn btn-primary"
        onclick="saveSettings()"
        style={{ width: "100%" }}
      >
        Save Settings
      </button>
    </div>
  </div>
  {/* Profile Panel */}
  <div
    className="side-panel right"
    id="profilePanel"
    role="dialog"
    aria-label="Profile"
  >
    <div className="panel-header">
      <h2>Profile</h2>
      <button
        className="control-btn"
        onclick="toggleProfile()"
        aria-label="Close Profile"
      >
        <i className="fas fa-times" />
      </button>
    </div>
    {/* Hero Section */}
    <div className="profile-hero">
      <div className="profile-avatar-ring" id="profileAvatarRing">
        <div
          className="avatar-fallback skeleton skeleton-avatar"
          id="profileAvatarInner"
        >
          {/* Content loaded dynamically */}
        </div>
        <div
          className="profile-avatar-edit"
          onclick="triggerAvatarUpload()"
          title="Change Avatar"
          role="button"
          tabIndex={0}
        >
          <i className="fas fa-camera" />
        </div>
      </div>
      <input
        type="file"
        id="avatarFileInput"
        accept="image/*"
        style={{ display: "none" }}
        onchange="handleAvatarUpload(event)"
        aria-hidden="true"
      />
      <div className="profile-name-row">
        <span className="profile-display-name" id="profileDisplayName">
          <span
            className="skeleton skeleton-text"
            style={{ width: 80, height: "1em", display: "inline-block" }}
          />
        </span>
        <span
          className="profile-provider-badge unknown"
          id="profileProviderBadge"
        >
          <i className="fas fa-circle" />{" "}
          <span
            className="skeleton skeleton-text"
            style={{ width: 40, height: "0.8em", display: "inline-block" }}
          />
        </span>
      </div>
      <div
        className="profile-email"
        id="profileEmailRow"
        style={{ display: "none" }}
      >
        <i className="fas fa-envelope" style={{ fontSize: "0.75rem" }} />
        <span id="profileEmail">-</span>
      </div>
      <div
        className="profile-coins-row"
        id="profileCoinsRow"
        style={{ display: "none" }}
      >
        <i className="fas fa-coins" />
        <span id="profileCoinsCount">0</span>
      </div>
    </div>
    {/* Stats Grid */}
    <div className="profile-stats-grid">
      <div className="profile-stat-cell">
        <div className="val" id="profileStatMatches">
          0
        </div>
        <div className="lbl">Matches</div>
      </div>
      <div className="profile-stat-cell">
        <div className="val" id="profileStatLevel">
          1
        </div>
        <div className="lbl">Level</div>
      </div>
      <div className="profile-stat-cell">
        <div className="val" id="profileStatLikes">
          0
        </div>
        <div className="lbl">Likes</div>
      </div>
    </div>
    {/* Info List */}
    <div className="profile-info-list">
      <div className="profile-info-row">
        <div className="profile-info-left">
          <div className="profile-info-icon">
            <i className="fas fa-shield-alt" />
          </div>
          <div>
            <div className="profile-info-label">Age Verified</div>
            <div
              className="profile-info-value unverified"
              id="profileAgeStatus"
            >
              Not Verified
            </div>
          </div>
        </div>
      </div>
      <div className="profile-info-row">
        <div className="profile-info-left">
          <div className="profile-info-icon">
            <i className="fas fa-venus-mars" />
          </div>
          <div>
            <div className="profile-info-label">Gender</div>
            <div className="profile-info-value none" id="profileGender">
              Not Set
            </div>
          </div>
        </div>
      </div>
      <div className="profile-info-row">
        <div className="profile-info-left">
          <div className="profile-info-icon">
            <i className="fas fa-map-marker-alt" />
          </div>
          <div>
            <div className="profile-info-label">Location</div>
            <div className="profile-info-value none" id="profileLocation">
              Not Set
            </div>
          </div>
        </div>
      </div>
      <div className="profile-info-row">
        <div className="profile-info-left">
          <div className="profile-info-icon">
            <i className="fas fa-calendar-alt" />
          </div>
          <div>
            <div className="profile-info-label">Member Since</div>
            <div className="profile-info-value none" id="profileJoinDate">
              -
            </div>
          </div>
        </div>
      </div>
      <div className="profile-info-row">
        <div className="profile-info-left">
          <div className="profile-info-icon">
            <i className="fas fa-fingerprint" />
          </div>
          <div>
            <div className="profile-info-label">User ID</div>
            <div
              className="profile-info-value none"
              id="profileUserId"
              style={{ fontSize: "0.8rem", fontFamily: "monospace" }}
            >
              -
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Actions */}
    <div className="profile-actions">
      <button className="profile-action-btn edit" onclick="openEditNameModal()">
        <i className="fas fa-pen" /> Edit Display Name
      </button>
      <button className="profile-action-btn coins" onclick="openPaymentModal()">
        <i className="fas fa-coins" /> Get Coins
      </button>
      <button
        className="profile-action-btn verify"
        id="profileVerifyBtn"
        onclick="openAgeVerifyModal()"
      >
        <i className="fas fa-id-card" /> Verify Your Age
      </button>
      <button className="profile-action-btn logout" onclick="logout()">
        <i className="fas fa-sign-out-alt" /> Logout
      </button>
    </div>
  </div>
  {/* Edit Name Modal */}
  <div
    className="modal"
    id="editNameModal"
    role="dialog"
    aria-labelledby="editNameTitle"
  >
    <div className="modal-content">
      <div className="modal-header">
        <h3 id="editNameTitle">Edit Display Name</h3>
        <button
          className="control-btn"
          onclick="closeEditNameModal()"
          aria-label="Close"
        >
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="form-group">
        <label htmlFor="editNameInput">Display Name (max 20 characters)</label>
        <input
          type="text"
          className="form-control"
          id="editNameInput"
          placeholder="Enter new name"
          maxLength={20}
        />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          className="btn"
          style={{ background: "var(--dark)", color: "var(--text)" }}
          onclick="closeEditNameModal()"
        >
          Cancel
        </button>
        <button className="btn btn-primary" onclick="saveProfileFromModal()">
          Save
        </button>
      </div>
    </div>
  </div>
  {/* Chat Panel */}
  <div
    id="chatPanel"
    className="side-panel right"
    style={{ display: "flex", flexDirection: "column" }}
    role="dialog"
    aria-label="Chat"
  >
    <div className="panel-header">
      <h3>Chat</h3>
      <button
        className="control-btn"
        onclick="toggleChat()"
        aria-label="Close Chat"
      >
        <i className="fas fa-times" />
      </button>
    </div>
    <div
      className="chat-messages"
      id="chatMessages"
      style={{ padding: 20, flex: 1, overflowY: "auto" }}
      aria-live="polite"
    />
    <div
      id="typingIndicator"
      style={{
        padding: "0 20px 5px",
        fontSize: "0.8rem",
        color: "var(--text-muted)",
        height: 18,
        display: "none"
      }}
    >
      Stranger is typing...
    </div>
    <div
      style={{
        padding: 15,
        borderTop: "1px solid var(--glass-border)",
        display: "flex",
        gap: 10
      }}
    >
      <label htmlFor="messageInput" style={{ display: "none" }}>
        Message
      </label>
      <input
        type="text"
        id="messageInput"
        placeholder="Type a message..."
        style={{
          flex: 1,
          padding: "10px 15px",
          background: "var(--dark)",
          border: "1px solid var(--glass-border)",
          borderRadius: 25,
          color: "var(--text)",
          fontFamily: "inherit"
        }}
        maxLength={500}
      />
      <button
        onclick="sendMessage()"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "var(--primary)",
          color: "white",
          cursor: "pointer",
          flexShrink: 0
        }}
        aria-label="Send Message"
      >
        <i className="fas fa-paper-plane" />
      </button>
    </div>
  </div>
  {/* Report Modal */}
  <div
    className="modal"
    id="reportModal"
    role="dialog"
    aria-labelledby="reportTitle"
  >
    <div className="modal-content">
      <div className="modal-header">
        <h3 id="reportTitle">Report User</h3>
      </div>
      <div
        className="report-reasons"
        role="listbox"
        aria-label="Report Reasons"
      >
        <div
          className="report-option"
          data-reason="Inappropriate behavior during video chat"
          role="option"
        >
          <i className="fas fa-user-times" style={{ color: "var(--danger)" }} />{" "}
          Inappropriate Behavior
        </div>
        <div
          className="report-option"
          data-reason="Spamming links or scam attempts"
          role="option"
        >
          <i className="fas fa-ban" style={{ color: "var(--warning)" }} /> Spam
          or Scam
        </div>
        <div
          className="report-option"
          data-reason="Appears to be under 18 years old"
          role="option"
        >
          <i className="fas fa-child" style={{ color: "var(--primary)" }} />{" "}
          Underage User
        </div>
        <div
          className="report-option"
          data-reason="Threats or violent behavior"
          role="option"
        >
          <i
            className="fas fa-fist-raised"
            style={{ color: "var(--danger)" }}
          />{" "}
          Violence or Threats
        </div>
        <div
          className="report-option"
          data-reason="Exposing nudity or sexual content"
          role="option"
        >
          <i className="fas fa-eye-slash" style={{ color: "var(--danger)" }} />{" "}
          Nudity or Sexual Content
        </div>
        <div
          className="report-option"
          data-reason="Other rule violation"
          role="option"
        >
          <i
            className="fas fa-exclamation-triangle"
            style={{ color: "var(--warning)" }}
          />{" "}
          Other
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="reportDetails">Additional details (optional)</label>
        <textarea
          className="form-control"
          id="reportDetails"
          rows={3}
          placeholder="Provide more information..."
          maxLength={200}
          defaultValue={""}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onclick="submitReport()">
          Submit Report
        </button>
        <button
          className="btn"
          style={{ background: "var(--dark)", color: "var(--text)" }}
          onclick="closeReportModal()"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
  {/* Gifts Modal */}
  <div className="modal" id="giftsModal" role="dialog" aria-label="Send Gift">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Send a Gift</h3>
        <button
          className="control-btn"
          onclick="closeGiftsModal()"
          aria-label="Close"
        >
          <i className="fas fa-times" />
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 15,
          padding: 20
        }}
      >
        <button
          className="gift-btn"
          onclick="sendGift('rose',10)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>🌹</div>
          <div style={{ fontWeight: 600 }}>Rose</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            10 coins
          </div>
        </button>
        <button
          className="gift-btn"
          onclick="sendGift('heart',15)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>❤️</div>
          <div style={{ fontWeight: 600 }}>Heart</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            15 coins
          </div>
        </button>
        <button
          className="gift-btn"
          onclick="sendGift('star',20)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>⭐</div>
          <div style={{ fontWeight: 600 }}>Star</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            20 coins
          </div>
        </button>
        <button
          className="gift-btn"
          onclick="sendGift('diamond',50)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>💎</div>
          <div style={{ fontWeight: 600 }}>Diamond</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            50 coins
          </div>
        </button>
        <button
          className="gift-btn"
          onclick="sendGift('crown',100)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>👑</div>
          <div style={{ fontWeight: 600 }}>Crown</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            100 coins
          </div>
        </button>
        <button
          className="gift-btn"
          onclick="sendGift('rocket',200)"
          style={{
            padding: 20,
            background: "var(--dark)",
            border: "2px solid transparent",
            borderRadius: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 5 }}>🚀</div>
          <div style={{ fontWeight: 600 }}>Rocket</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            200 coins
          </div>
        </button>
      </div>
    </div>
  </div>
  {/* Payment Modal (Coins) */}
  <div
    className="payment-modal"
    id="paymentModal"
    role="dialog"
    aria-label="Purchase Coins"
  >
    <div className="payment-content">
      <div className="modal-header">
        <h3>Get Coins</h3>
      </div>
      <div className="coins-display">
        <i className="fas fa-coins" /> <span id="currentCoins">0</span>
      </div>
      <div className="coin-packages">
        <div
          className="coin-package"
          data-coins={100}
          data-price="4.99"
          role="button"
          tabIndex={0}
        >
          <div className="coin-amount">100</div>
          <div className="coin-price">$4.99</div>
        </div>
        <div
          className="coin-package"
          data-coins={250}
          data-price="9.99"
          role="button"
          tabIndex={0}
        >
          <div className="coin-amount">250</div>
          <div className="coin-price">$9.99</div>
        </div>
        <div
          className="coin-package"
          data-coins={500}
          data-price="19.99"
          role="button"
          tabIndex={0}
        >
          <div className="coin-amount">500</div>
          <div className="coin-price">$19.99</div>
        </div>
        <div
          className="coin-package"
          data-coins={1000}
          data-price="39.99"
          role="button"
          tabIndex={0}
        >
          <div className="coin-amount">1000</div>
          <div className="coin-price">$39.99</div>
        </div>
      </div>
      <button
        className="btn btn-primary"
        onclick="purchaseCoins()"
        style={{ width: "100%", marginTop: 20 }}
      >
        Purchase Coins
      </button>
    </div>
  </div>
  <button
    className="fab"
    id="settingsFab"
    onclick="toggleSettings()"
    title="Settings"
    aria-label="Open Settings"
  >
    <i className="fas fa-cog" />
  </button>
  <button
    className="fab"
    id="profileFab"
    onclick="toggleProfile()"
    title="Profile"
    aria-label="Open Profile"
  >
    <i className="fas fa-user" />
  </button>
</>
