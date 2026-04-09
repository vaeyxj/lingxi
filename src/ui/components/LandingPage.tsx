import { useState } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(onEnter, 800);
  };

  return (
    <div className={`landing ${entering ? 'landing-exit' : ''}`}>
      {/* Animated background */}
      <div className="landing-bg">
        <div className="landing-stars" />
        <div className="landing-grid" />
      </div>

      {/* Floating pixel particles */}
      <div className="landing-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="landing-particle"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="landing-content">
        <div className="landing-badge">PIXEL WORLD</div>
        <h1 className="landing-title">
          <span className="landing-title-char" style={{ animationDelay: '0.1s' }}>灵</span>
          <span className="landing-title-char" style={{ animationDelay: '0.2s' }}>栖</span>
          <span className="landing-title-char" style={{ animationDelay: '0.3s' }}>世</span>
          <span className="landing-title-char" style={{ animationDelay: '0.4s' }}>界</span>
        </h1>

        <p className="landing-subtitle">
          一个像素风格的虚拟办公社区，在这里你可以探索园区、管理员工、感受充满活力的小镇生活。
        </p>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="feature-icon">🏢</span>
            <div>
              <div className="feature-title">探索园区</div>
              <div className="feature-desc">会议室、咖啡角、超市、健身房...丰富的功能区域等你发现</div>
            </div>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">👥</span>
            <div>
              <div className="feature-title">管理员工</div>
              <div className="feature-desc">指挥员工去开会、喝咖啡、健身，观察他们的状态变化</div>
            </div>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">🎮</span>
            <div>
              <div className="feature-title">自由漫步</div>
              <div className="feature-desc">WASD移动角色，滚轮缩放，拖拽平移，沉浸式观景</div>
            </div>
          </div>
        </div>

        <button className="landing-enter-btn" onClick={handleEnter}>
          <span className="enter-btn-text">进入小镇</span>
          <span className="enter-btn-arrow">→</span>
        </button>

        <div className="landing-keys">
          <kbd>W A S D</kbd> 移动
          <span className="key-sep">|</span>
          <kbd>空格</kbd> 聚焦角色
          <span className="key-sep">|</span>
          <kbd>H</kbd> 切换界面
          <span className="key-sep">|</span>
          <kbd>滚轮</kbd> 缩放
        </div>
      </div>

      <div className="landing-footer">
        Lingxi World &middot; Pixel Office Simulation
      </div>
    </div>
  );
}
