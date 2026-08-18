import { useChatStore } from '../store/chatStore';

export function Avatar() {
  const avatarState = useChatStore(state => state.avatarState);

  // Determine avatar class based on state
  const getAvatarClass = () => {
    switch (avatarState) {
      case 'listening':
        return 'avatar-listening';
      case 'thinking':
        return 'avatar-thinking';
      case 'speaking':
        return 'avatar-speaking';
      case 'idle':
      default:
        return 'avatar-idle';
    }
  };

  return (
    <div className={`avatar-container ${getAvatarClass()}`} aria-label={`XYZ AI assistant - ${avatarState} state`}>
      {/* Avatar visual representation */}
      <div className="avatar-inner">
        {/* Simple visual indicator - can be replaced with actual images/animations */}
        <div className="avatar-face">
          <div className="avatar-eyes">
            <div className="avatar-eye left"></div>
            <div className="avatar-eye right"></div>
          </div>
          <div className="avatar-mouth"></div>
        </div>
      </div>

      {/* Optional: Add tooltip or label */}
      <div className="avatar-label">
        XYZ AI
      </div>
    </div>
  );
}