import useAppStore from '../store/useAppStore';

export default function VideoContainer({ localVideoRef, remoteVideoRef, leaveChannel }) {
  const { isInCall, isMatching, startMatching } = useAppStore();

  return (
    <div className="video-container" id="videoContainer">
      {/* Remote Video */}
      <div id="remoteVideoWrapper">
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>

      {/* Matching Overlay */}
      {isMatching && (
        <div id="blurOverlay" className="active">
          <div className="matching-content">
            <div className="pulse-animation"><i className="fas fa-search" style={{fontSize: '3rem', color: 'white'}}></i></div>
            <div className="matching-text">Finding someone to chat with...</div>
            <div className="spinner"></div>
            <button className="cancel-btn" onClick={() => useAppStore.stopMatching()}>Cancel Search</button>
          </div>
        </div>
      )}

      {/* Local Video */}
      <div id="localVideoWrapper">
        <div ref={localVideoRef} style={{width: '100%', height: '100%'}}></div>
      </div>

      {/* Controls */}
      <div id="controls">
        {!isInCall ? (
          <button className="control-btn primary" onClick={startMatching}>
            <i className="fas fa-play"></i>
          </button>
        ) : (
          <div style={{display: 'flex', gap: '8px'}}>
            <button className="control-btn danger" onClick={leaveChannel}>
              <i className="fas fa-stop"></i>
            </button>
            {/* Add other active controls here */}
          </div>
        )}
      </div>
    </div>
  );
}
