<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>MisVord - Hero Section</title>
		<style>
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}

			body {
				font-family: "Arial", sans-serif;
				background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 100%);
				color: #ffffff;
				overflow-x: hidden;
			}

			.hero-section {
				height: 100vh;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				position: relative;
				text-align: center;
			}

			/* Login Button */
			.login-container {
				position: fixed;
				top: 2rem;
				right: 2rem;
				z-index: 1000;
			}

			.login-btn {
				width: 50px;
				height: 50px;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.1);
				border: 2px solid rgba(135, 206, 250, 0.3);
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.3s ease;
				backdrop-filter: blur(10px);
				position: relative;
			}

			.login-btn:hover {
				background: rgba(135, 206, 250, 0.2);
				border-color: rgba(135, 206, 250, 0.6);
				transform: scale(1.1);
			}

			.login-btn svg {
				width: 24px;
				height: 24px;
				fill: #87ceeb;
				transition: all 0.3s ease;
			}

			.login-btn:hover svg {
				fill: #ffffff;
			}

			.login-tooltip {
				position: absolute;
				right: 60px;
				top: 50%;
				transform: translateY(-50%);
				background: rgba(0, 0, 0, 0.8);
				color: #87ceeb;
				padding: 8px 12px;
				border-radius: 6px;
				font-size: 0.9rem;
				white-space: nowrap;
				opacity: 0;
				pointer-events: none;
				transition: all 0.3s ease;
				backdrop-filter: blur(10px);
			}

			.login-tooltip::after {
				content: "";
				position: absolute;
				left: 100%;
				top: 50%;
				transform: translateY(-50%);
				border: 6px solid transparent;
				border-left-color: rgba(0, 0, 0, 0.8);
			}

			.login-btn:hover .login-tooltip {
				opacity: 1;
			}

			/* Floating Elements */
			.floating-elements {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: 1;
			}

			.floating-item {
				position: absolute;
				width: 60px;
				height: 60px;
				border-radius: 12px;
				animation: float 6s ease-in-out infinite;
				opacity: 0.8;
				object-fit: cover;
			}

			.floating-item:nth-child(1) {
				top: 15%;
				left: 8%;
				animation-delay: 0s;
				animation-duration: 8s;
			}

			.floating-item:nth-child(2) {
				top: 25%;
				right: 12%;
				animation-delay: -2s;
				animation-duration: 7s;
				width: 50px;
				height: 50px;
			}

			.floating-item:nth-child(3) {
				top: 45%;
				right: 8%;
				animation-delay: -4s;
				animation-duration: 9s;
				width: 70px;
				height: 70px;
			}

			.floating-item:nth-child(4) {
				bottom: 25%;
				left: 10%;
				animation-delay: -1s;
				animation-duration: 6s;
				width: 55px;
				height: 55px;
			}

			.floating-item:nth-child(5) {
				bottom: 35%;
				right: 15%;
				animation-delay: -3s;
				animation-duration: 8s;
			}

			.floating-item:nth-child(6) {
				top: 35%;
				left: 5%;
				animation-delay: -5s;
				animation-duration: 7s;
				width: 45px;
				height: 45px;
			}

			.floating-item:nth-child(7) {
				top: 60%;
				left: 15%;
				animation-delay: -2.5s;
				animation-duration: 8.5s;
				width: 65px;
				height: 65px;
			}

			.floating-item:nth-child(8) {
				top: 10%;
				right: 25%;
				animation-delay: -1.5s;
				animation-duration: 7.5s;
				width: 40px;
				height: 40px;
			}

			@keyframes float {
				0%,
				100% {
					transform: translateY(0px) rotate(0deg);
				}
				25% {
					transform: translateY(-20px) rotate(90deg);
				}
				50% {
					transform: translateY(-10px) rotate(180deg);
				}
				75% {
					transform: translateY(-15px) rotate(270deg);
				}
			}

			/* Particles */
			.particles {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: 1;
			}

			.particle {
				position: absolute;
				width: 2px;
				height: 2px;
				background: rgba(135, 206, 250, 0.6);
				border-radius: 50%;
				animation: twinkle 3s infinite ease-in-out;
			}

			@keyframes twinkle {
				0%,
				100% {
					opacity: 0.3;
					transform: scale(1);
				}
				50% {
					opacity: 1;
					transform: scale(1.2);
				}
			}

			/* Enhanced Main Content with Light Sweep Animation */
			.main-text {
				font-size: clamp(4rem, 12vw, 8rem);
				font-weight: 900;
				letter-spacing: 0.05em;
				position: relative;
				z-index: 2;
				margin-bottom: 2rem;
				text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.4), 0 0 80px rgba(135, 206, 250, 0.3), 0 0 100px rgba(135, 206, 250, 0.2);
				animation: enhancedMove 10s ease-in-out infinite;
				overflow: hidden;
			}

			.main-text::before {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
				animation: lightSweep 4s ease-in-out infinite;
				z-index: 1;
			}

			@keyframes enhancedMove {
				0%,
				100% {
					transform: translateX(0px) translateY(0px) scale(1) rotateZ(0deg);
				}
				20% {
					transform: translateX(15px) translateY(-8px) scale(1.03) rotateZ(0.5deg);
				}
				40% {
					transform: translateX(-10px) translateY(12px) scale(0.97) rotateZ(-0.3deg);
				}
				60% {
					transform: translateX(8px) translateY(-5px) scale(1.01) rotateZ(0.2deg);
				}
				80% {
					transform: translateX(-12px) translateY(7px) scale(0.99) rotateZ(-0.4deg);
				}
			}

			@keyframes lightSweep {
				0% {
					left: -100%;
					opacity: 0;
				}
				50% {
					opacity: 1;
				}
				100% {
					left: 100%;
					opacity: 0;
				}
			}

			.char {
				display: inline-block;
				transition: all 0.3s ease;
				cursor: pointer;
				position: relative;
				z-index: 2;
			}

			.char:hover {
				text-shadow: 0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(255, 255, 255, 0.8), 0 0 75px rgba(255, 255, 255, 0.6), 0 0 100px rgba(135, 206, 250, 0.4), 0 0 125px rgba(135, 206, 250, 0.3);
				transform: scale(1.1);
			}

			.scrambling {
				animation: scramble 0.1s infinite;
			}

			@keyframes scramble {
				0% {
					transform: translateY(0px) scale(1.1);
				}
				25% {
					transform: translateY(-2px) scale(1.1);
				}
				50% {
					transform: translateY(1px) scale(1.1);
				}
				75% {
					transform: translateY(-1px) scale(1.1);
				}
				100% {
					transform: translateY(0px) scale(1.1);
				}
			}

			.subtitle {
				font-size: clamp(1rem, 3vw, 1.5rem);
				color: #87ceeb;
				font-weight: 300;
				letter-spacing: 0.1em;
				margin-bottom: 1rem;
				opacity: 0;
				animation: fadeInUp 1.5s ease-out 2s both, enhancedSubtitleMove 8s ease-in-out infinite 3s;
				z-index: 2;
				position: relative;
			}

			@keyframes enhancedSubtitleMove {
				0%,
				100% {
					transform: translateX(0px) translateY(0px) scale(1);
				}
				25% {
					transform: translateX(-12px) translateY(5px) scale(1.02);
				}
				50% {
					transform: translateX(8px) translateY(-3px) scale(0.98);
				}
				75% {
					transform: translateX(-5px) translateY(7px) scale(1.01);
				}
			}

			.version-text {
				position: absolute;
				bottom: 2rem;
				right: 2rem;
				font-size: 0.9rem;
				color: rgba(135, 206, 250, 0.7);
				font-family: "Courier New", monospace;
				z-index: 2;
			}

			/* Scroll Indicator */
			.scroll-indicator {
				position: absolute;
				bottom: 3rem;
				left: 50%;
				transform: translateX(-50%);
				z-index: 2;
				animation: bounce 2s infinite;
				cursor: pointer;
			}

			.scroll-indicator svg {
				width: 24px;
				height: 24px;
				fill: rgba(135, 206, 250, 0.7);
			}

			@keyframes bounce {
				0%,
				20%,
				50%,
				80%,
				100% {
					transform: translateX(-50%) translateY(0);
				}
				40% {
					transform: translateX(-50%) translateY(-10px);
				}
				60% {
					transform: translateX(-50%) translateY(-5px);
				}
			}

			@keyframes fadeInUp {
				from {
					opacity: 0;
					transform: translateY(30px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			.glow-effect {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 80%;
				height: 60%;
				background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
				z-index: 0;
				animation: pulse 4s ease-in-out infinite alternate;
			}

			@keyframes pulse {
				0% {
					opacity: 0.3;
					transform: translate(-50%, -50%) scale(0.8);
				}
				100% {
					opacity: 0.6;
					transform: translate(-50%, -50%) scale(1.2);
				}
			}

			/* Features Section with Particle Effects */
			.features-section {
				min-height: 100vh;
				padding: 4rem 2rem;
				background: linear-gradient(135deg, #2d1b69 0%, #1a1a2e 50%, #16213e 100%);
				position: relative;
			}

			.features-container {
				max-width: 1400px;
				margin: 0 auto;
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
				gap: 2rem;
				padding: 2rem 0;
			}

			.feature-card {
				background: rgba(45, 45, 60, 0.8);
				border-radius: 16px;
				padding: 2rem;
				position: relative;
				transition: all 0.3s ease;
				border: 1px solid rgba(255, 255, 255, 0.1);
				backdrop-filter: blur(10px);
				cursor: pointer;
				transform-style: preserve-3d;
				perspective: 1000px;
				overflow: hidden;
			}

			/* Feature Card Particle Background */
			.card-particles {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				/* height: 100%; */
				pointer-events: none;
				opacity: 0;
				transition: opacity 0.3s ease;
				z-index: 0;
			}

			.feature-card:hover .card-particles {
				opacity: 1;
			}

			.card-particle {
				position: absolute;
				width: 6px;
				height: 6px;
				background: #4a90e2;
				border-radius: 50%;
				box-shadow: 0 0 15px #4a90e2, 0 0 25px #4a90e2, 0 0 35px #4a90e2;
				animation: cardParticleFloat 4s ease-in-out infinite;
			}

			@keyframes cardParticleFloat {
				0%,
				100% {
					opacity: 0.4;
					transform: translateY(0px) scale(1);
				}
				50% {
					opacity: 1;
					transform: translateY(-15px) scale(1.3);
				}
			}

			.feature-card > * {
				position: relative;
				z-index: 1;
			}

			.feature-card:hover {
				transform: translateY(-5px);
				border: 1px solid;
				box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.voice-chat:hover {
				border-color: #00d4aa;
				box-shadow: 0 0 30px rgba(0, 212, 170, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.nitro-premium:hover {
				border-color: #ffa500;
				box-shadow: 0 0 30px rgba(255, 165, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.smart-bots:hover {
				border-color: #ff69b4;
				box-shadow: 0 0 30px rgba(255, 105, 180, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.server-manager:hover {
				border-color: #ff4757;
				box-shadow: 0 0 30px rgba(255, 71, 87, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.friends-network:hover {
				border-color: #5865f2;
				box-shadow: 0 0 30px rgba(88, 101, 242, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.feature-card.server-explorer:hover {
				border-color: #9c88ff;
				box-shadow: 0 0 30px rgba(156, 136, 255, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3);
			}

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 1.5rem;
			}

			.card-icon {
				width: 48px;
				height: 48px;
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
				margin-bottom: 1rem;
			}

			.voice-chat .card-icon {
				background: #00d4aa;
			}

			.nitro-premium .card-icon {
				background: #ffa500;
			}

			.smart-bots .card-icon {
				background: #ff69b4;
			}

			.server-manager .card-icon {
				background: #ff4757;
			}

			.friends-network .card-icon {
				background: #5865f2;
			}

			.server-explorer .card-icon {
				background: #9c88ff;
			}

			.card-status {
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}

			.status-dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: #00d4aa;
			}

			.status-dot.premium {
				background: #ffa500;
			}

			.status-text {
				font-size: 0.75rem;
				color: #00d4aa;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}

			.status-text.premium {
				color: #ffa500;
			}

			.card-title {
				font-size: 1.5rem;
				font-weight: 700;
				color: #ffffff;
				margin-bottom: 0.5rem;
			}

			.card-category {
				font-size: 0.75rem;
				color: #a0a0a0;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				margin-bottom: 1rem;
			}

			.card-description {
				color: #c0c0c0;
				line-height: 1.6;
				margin-bottom: 2rem;
			}

			.card-features {
				display: flex;
				gap: 1.5rem;
				margin-bottom: 2rem;
			}

			.feature-badge {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.875rem;
				color: #a0a0a0;
			}

			.feature-icon {
				width: 16px;
				height: 16px;
				opacity: 0.7;
			}

			.card-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.card-button {
				flex: 1;
				padding: 12px 24px;
				border-radius: 8px;
				border: none;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.3s ease;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 0.5rem;
				margin-right: 1rem;
				background: #5865f2;
				color: white;
			}

			.card-button:hover {
				background: #4752c4;
			}

			.card-settings {
				width: 32px;
				height: 32px;
				border-radius: 6px;
				background: rgba(255, 255, 255, 0.1);
				border: none;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.3s ease;
			}

			.card-settings:hover {
				background: rgba(255, 255, 255, 0.2);
			}

			.card-settings svg {
				width: 16px;
				height: 16px;
				fill: #a0a0a0;
			}

			.scroll-navigation {
				text-align: center;
				padding: 2rem 0;
				color: #a0a0a0;
				font-size: 0.875rem;
			}

			/* Success Stories Section - Enhanced with Flip Animation */
			.success-section {
				min-height: 100vh;
				padding: 4rem 2rem;
				background: linear-gradient(135deg, #4a148c 0%, #1a237e 50%, #0d47a1 100%);
				position: relative;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
			}

			.success-title {
				font-size: 3rem;
				font-weight: 700;
				text-align: center;
				margin-bottom: 3rem;
				color: #ffffff;
			}

			/* Digital Book with Enhanced Flip Animation */
			.digital-book {
				perspective: 2000px;
				position: relative;
				margin: 2rem 0;
			}

			.book-container {
				width: 800px;
				height: 500px;
				position: relative;
				transform-style: preserve-3d;
				margin: 0 auto;
			}

			.book-page {
				position: absolute;
				width: 400px;
				height: 500px;
				border-radius: 10px;
				padding: 2rem;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				transform-style: preserve-3d;
				transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
				cursor: pointer;
				overflow: hidden;
			}

			.book-page::before {
				content: "";
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
				opacity: 0;
				transition: opacity 0.6s ease;
				pointer-events: none;
			}

			.book-page.flipping::before {
				opacity: 1;
			}

			.book-page.left-page {
				left: 0;
				background: linear-gradient(135deg, #667eea, #764ba2);
				color: white;
				transform-origin: right center;
				transform: rotateY(0deg);
				z-index: 2;
			}

			.book-page.right-page {
				right: 0;
				background: #ffffff;
				color: #333;
				transform-origin: left center;
				z-index: 1;
			}

			/* Enhanced flip animation */
			.book-page.page-flip-left {
				animation: pageFlipLeft 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
			}

			.book-page.page-flip-right {
				animation: pageFlipRight 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
			}

			@keyframes pageFlipLeft {
				0% {
					transform: rotateY(0deg);
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}
				25% {
					transform: rotateY(-45deg);
					box-shadow: -5px 10px 30px rgba(0, 0, 0, 0.4);
				}
				50% {
					transform: rotateY(-90deg);
					box-shadow: -10px 10px 30px rgba(0, 0, 0, 0.5);
				}
				75% {
					transform: rotateY(-135deg);
					box-shadow: -5px 10px 30px rgba(0, 0, 0, 0.4);
				}
				100% {
					transform: rotateY(-180deg);
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}
			}

			@keyframes pageFlipRight {
				0% {
					transform: rotateY(0deg);
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}
				25% {
					transform: rotateY(45deg);
					box-shadow: 5px 10px 30px rgba(0, 0, 0, 0.4);
				}
				50% {
					transform: rotateY(90deg);
					box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.5);
				}
				75% {
					transform: rotateY(135deg);
					box-shadow: 5px 10px 30px rgba(0, 0, 0, 0.4);
				}
				100% {
					transform: rotateY(180deg);
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				}
			}

			/* Single Stories Page Initially */
			.stories-page {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100%;
				backface-visibility: hidden;
			}

			.stories-page.hidden {
				display: none;
			}

			/* Fixed Mirror effect for left page */
			.book-page.left-page.opened .page-content {
				transform: scaleX(-1);
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100%;
				text-align: center;
			}

			.book-page.right-page .page-content,
			.book-page.left-page:not(.opened) .page-content {
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				text-align: center;
				backface-visibility: hidden;
			}

			.page-title {
				font-size: 2rem;
				font-weight: 700;
				margin-bottom: 1.5rem;
				text-align: center;
			}

			.page-icon {
				font-size: 3rem;
				text-align: center;
				margin-bottom: 2rem;
			}

			.page-text {
				font-size: 1.1rem;
				line-height: 1.8;
				text-align: center;
				margin-bottom: 1rem;
				max-width: 300px;
			}

			.page-stats {
				margin-top: 2rem;
				text-align: center;
			}

			.stat-item {
				margin: 0.5rem 0;
				font-weight: 600;
				font-size: 0.9rem;
			}

			/* MisVord Nitro Section - Fixed Hexagon Orbit */
			.nitro-section {
				min-height: 100vh;
				padding: 4rem 2rem;
				background: linear-gradient(135deg, #6a1b9a 0%, #4a148c 25%, #3f006c 50%, #2e0854 75%, #1a0033 100%);
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
			}

			.nitro-container {
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				max-width: 1400px;
				position: relative;
			}

			.nitro-title {
				font-size: 4rem;
				font-weight: 700;
				color: #ffffff;
				margin-right: 4rem;
				background: linear-gradient(135deg, #9c27b0, #00bcd4);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
			}

			.nitro-interactive {
				position: relative;
				width: 400px;
				height: 400px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.nitro-center {
				width: 120px;
				height: 120px;
				background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: grab;
				transition: all 0.3s ease;
				z-index: 10;
				position: absolute;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
			}

			.nitro-center:active {
				cursor: grabbing;
			}

			.nitro-center:hover {
				transform: scale(1.1);
				box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
			}

			.nitro-logo {
				font-size: 2rem;
				font-weight: 900;
				color: white;
				text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
			}

			.hexagon {
				position: absolute;
				width: 80px;
				height: 80px;
				background: linear-gradient(135deg, #9c27b0, #673ab7);
				clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
				cursor: pointer;
				animation: hexagonOrbit 20s linear infinite;
				transform-origin: center;
			}

			.hexagon:hover {
				transform: scale(1.2);
				z-index: 5;
			}

			/* Fixed hexagon hover behavior - only when center is hovered */
			.nitro-center:hover ~ .hexagon {
				animation-play-state: paused;
				transform: scale(1.1) translateX(var(--expand-x)) translateY(var(--expand-y));
			}

			.hexagon-content {
				text-align: center;
				color: white;
				font-size: 0.6rem;
				font-weight: 600;
				padding: 0.3rem;
				line-height: 1.1;
			}

			.hexagon-icon {
				font-size: 1rem;
				margin-bottom: 0.1rem;
				display: block;
			}

			/* Fixed Hexagon Positions for Proper Orbit */
			.hexagon:nth-child(2) {
				background: linear-gradient(135deg, #e91e63, #9c27b0);
				animation-delay: 0s;
				--expand-x: 0px;
				--expand-y: -40px;
			}

			.hexagon:nth-child(3) {
				background: linear-gradient(135deg, #ff9800, #f44336);
				animation-delay: -3.33s;
				--expand-x: 35px;
				--expand-y: -20px;
			}

			.hexagon:nth-child(4) {
				background: linear-gradient(135deg, #4caf50, #8bc34a);
				animation-delay: -6.66s;
				--expand-x: 35px;
				--expand-y: 20px;
			}

			.hexagon:nth-child(5) {
				background: linear-gradient(135deg, #2196f3, #03a9f4);
				animation-delay: -10s;
				--expand-x: 0px;
				--expand-y: 40px;
			}

			.hexagon:nth-child(6) {
				background: linear-gradient(135deg, #ff5722, #795548);
				animation-delay: -13.33s;
				--expand-x: -35px;
				--expand-y: 20px;
			}

			.hexagon:nth-child(7) {
				background: linear-gradient(135deg, #607d8b, #455a64);
				animation-delay: -16.66s;
				--expand-x: -35px;
				--expand-y: -20px;
			}

			@keyframes hexagonOrbit {
				0% {
					transform: rotate(0deg) translateX(120px) rotate(0deg);
				}
				100% {
					transform: rotate(360deg) translateX(120px) rotate(-360deg);
				}
			}

			.premium-label {
				position: absolute;
				right: -15%;
				top: 50%;
				transform: translateY(-50%) rotate(90deg);
				font-size: 1rem;
				color: rgba(255, 255, 255, 0.7);
				letter-spacing: 0.2em;
				font-weight: 600;
			}

			@media (max-width: 768px) {
				.book-container {
					width: 90vw;
					height: 60vh;
					max-width: 600px;
				}

				.book-page {
					width: 45vw;
					max-width: 300px;
					height: 60vh;
					padding: 1.5rem;
				}

				.features-container {
					grid-template-columns: 1fr;
					gap: 1.5rem;
					padding: 1rem 0;
				}

				.feature-card {
					padding: 1.5rem;
				}

				.card-features {
					flex-direction: column;
					gap: 1rem;
				}

				.login-container {
					top: 1rem;
					right: 1rem;
				}

				.login-btn {
					width: 40px;
					height: 40px;
				}

				.login-btn svg {
					width: 20px;
					height: 20px;
				}

				.main-text {
					font-size: clamp(2.5rem, 15vw, 6rem);
					margin-bottom: 1.5rem;
				}

				.subtitle {
					font-size: clamp(0.8rem, 4vw, 1.2rem);
					padding: 0 1rem;
				}

				.version-text {
					bottom: 1rem;
					right: 1rem;
					font-size: 0.8rem;
				}

				.floating-item {
					width: 40px !important;
					height: 40px !important;
				}

				.success-title {
					font-size: 2rem;
				}

				.nitro-container {
					flex-direction: column;
					gap: 2rem;
				}

				.nitro-title {
					font-size: 2.5rem;
					margin-right: 0;
					margin-bottom: 2rem;
				}

				.nitro-interactive {
					width: 300px;
					height: 300px;
				}

				.hexagon {
					width: 60px;
					height: 60px;
				}

				.nitro-center {
					width: 80px;
					height: 80px;
				}

				.nitro-logo {
					font-size: 1.5rem;
				}
			}
		</style>
	</head>
	<body>
		<div class="hero-section">
			<!-- Login Button -->
			<div class="login-container">
				<div class="login-btn">
					<svg viewBox="0 0 24 24">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
					</svg>
					<div class="login-tooltip">Login to MisVord</div>
				</div>
			</div>

			<!-- Floating Elements -->
			<div class="floating-elements">
				<img src="assets/landing-page/box_converted.png" alt="Floating Element 1" class="floating-item" />
				<img src="assets/landing-page/flying-cat_converted.png" alt="Floating Element 2" class="floating-item" />
				<img src="assets/landing-page/pan_converted.png" alt="Floating Element 3" class="floating-item" />
				<img src="assets/landing-page/actor-sit_converted.png" alt="Floating Element 4" class="floating-item" />
				<img src="assets/landing-page/green-egg_converted.png" alt="Floating Element 5" class="floating-item" />
				<img src="assets/landing-page/pan_converted.png" alt="Floating Element 6" class="floating-item" />
				<img src="assets/landing-page/thropy_converted.png"Floating Element 7" class="floating-item" />
				<img src="assets/landing-page/wumpus_happy_converted.png" alt="Floating Element 8" class="floating-item" />
			</div>

			<!-- Particles -->
			<div class="particles" id="particles"></div>

			<!-- Glow Effect -->
			<div class="glow-effect"></div>

			<!-- Enhanced Main Content with Light Sweep -->
			<div class="main-text" id="mainText">MISVORD</div>
			<div class="subtitle">Confront the challenges of learning and outgrow the boundaries together.</div>

			<!-- Version Text -->
			<div class="version-text">~24-2</div>

			<!-- Scroll Indicator -->
			<div class="scroll-indicator" onclick="scrollToFeatures()">
				<svg viewBox="0 0 24 24">
					<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
				</svg>
			</div>
		</div>

		<!-- Features Section with Particle Effects -->
		<div class="features-section" id="featuresSection">
			<div class="features-container">
				<!-- Voice Chat Card -->
				<div class="feature-card voice-chat">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">🎧</div>
							<div class="card-status">
								<div class="status-dot"></div>
								<span class="status-text">ACTIVE</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Voice Chat</h3>
					<p class="card-category">COMMUNICATION</p>
					<p class="card-description">High-quality voice communication with advanced audio controls and screen sharing capabilities</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">🔊</span>
							<span>Crystal Clear Audio</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">📹</span>
							<span>Video Support</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>🎤</span>
							Join Voice Channel
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Nitro Premium Card -->
				<div class="feature-card nitro-premium">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">👑</div>
							<div class="card-status">
								<div class="status-dot premium"></div>
								<span class="status-text premium">PREMIUM</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Nitro Premium</h3>
					<p class="card-category">PREMIUM</p>
					<p class="card-description">Unlock exclusive features with Nitro codes including enhanced profiles and premium perks</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">⭐</span>
							<span>Exclusive Features</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">🎨</span>
							<span>Custom Themes</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>👑</span>
							Get Nitro
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Smart Bots Card -->
				<div class="feature-card smart-bots">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">🤖</div>
							<div class="card-status">
								<div class="status-dot"></div>
								<span class="status-text">ACTIVE</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Smart Bots</h3>
					<p class="card-category">AUTOMATION</p>
					<p class="card-description">Create and manage intelligent bots for server automation and enhanced user engagement</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">🛡️</span>
							<span>Auto Moderation</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">⚡</span>
							<span>Custom Commands</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>➕</span>
							Create Bot
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Server Manager Card -->
				<div class="feature-card server-manager">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">🛡️</div>
							<div class="card-status">
								<div class="status-dot"></div>
								<span class="status-text">ACTIVE</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Server Manager</h3>
					<p class="card-category">MANAGEMENT</p>
					<p class="card-description">Comprehensive server administration tools with role management and member insights</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">👥</span>
							<span>Member Control</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">📊</span>
							<span>Analytics</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>✖️</span>
							Manage Server
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Friends Network Card -->
				<div class="feature-card friends-network">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">👥</div>
							<div class="card-status">
								<div class="status-dot"></div>
								<span class="status-text">ACTIVE</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Friends Network</h3>
					<p class="card-category">SOCIAL</p>
					<p class="card-description">Connect with friends through direct messages and private chat rooms with real-time notifications</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">💬</span>
							<span>Direct Messages</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">🔔</span>
							<span>Real-time Alerts</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>👥</span>
							Add Friends
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Server Explorer Card -->
				<div class="feature-card server-explorer">
					<div class="card-particles"></div>
					<div class="card-header">
						<div>
							<div class="card-icon">🔍</div>
							<div class="card-status">
								<div class="status-dot"></div>
								<span class="status-text">ACTIVE</span>
							</div>
						</div>
					</div>
					<h3 class="card-title">Server Explorer</h3>
					<p class="card-category">DISCOVERY</p>
					<p class="card-description">Discover and join public servers based on your interests with smart recommendation system</p>
					<div class="card-features">
						<div class="feature-badge">
							<span class="feature-icon">🔍</span>
							<span>Smart Discovery</span>
						</div>
						<div class="feature-badge">
							<span class="feature-icon">⭐</span>
							<span>Featured Servers</span>
						</div>
					</div>
					<div class="card-footer">
						<button class="card-button">
							<span>🔍</span>
							Explore Servers
						</button>
						<button class="card-settings">
							<svg viewBox="0 0 24 24">
								<path d="M11.5,1L2,6V8H21V6M16,10V17H19V19H2V17H5V10H7V17H9V10H11V17H13V10H15V17H14V10H16Z" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<div class="scroll-navigation">← Scroll to navigate →</div>
		</div>

		<!-- Success Stories Section - Enhanced with Flip Animation -->
		<div class="success-section" id="successSection">
			<div class="particles" id="particles2"></div>

			<h2 class="success-title">Success Stories</h2>

			<div class="digital-book">
				<div class="book-container">
					<div class="book-page left-page" id="leftPage" onclick="nextStory()">
						<div class="stories-page" id="storiesPage">
							<div class="page-icon">📚</div>
							<div class="page-title">Stories</div>
							<div class="page-text">Click to open and discover amazing community stories</div>
						</div>
						<div class="page-content" id="leftPageContent" style="display: none">
							<!-- Content will be populated by JavaScript -->
						</div>
					</div>

					<div class="book-page right-page" id="rightPage" style="display: none" onclick="nextStory()">
						<div class="page-content" id="rightPageContent">
							<!-- Content will be populated by JavaScript -->
						</div>
					</div>
				</div>
			</div>

			<div class="scroll-navigation">← Scroll to navigate →</div>
		</div>

		<!-- MisVord Nitro Section - Fixed Hexagon Orbit -->
		<div class="nitro-section" id="nitroSection">
			<div class="particles" id="particles3"></div>

			<div class="nitro-container">
				<h2 class="nitro-title">MisVord Nitro</h2>

				<div class="nitro-interactive" id="nitroInteractive">
					<div class="nitro-center" id="nitroCenter">
						<img src="assets/common/nitro_converted.png" alt="" class="nitro-logo" width="100">
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">⭐</span>
							Premium Unlimited
						</div>
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">🎤</span>
							Speech SMART
						</div>
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">🎨</span>
							Custom Emojis
						</div>
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">🎧</span>
							Enhanced Audio
						</div>
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">⚡</span>
							Priority Support
						</div>
					</div>

					<div class="hexagon">
						<div class="hexagon-content">
							<span class="hexagon-icon">🔥</span>
							Exclusive Features
						</div>
					</div>
				</div>

				<div class="premium-label">Premium</div>
			</div>
		</div>

		<script>
			let currentPage = 0;
			let totalPages = 4;
			let bookOpened = false;
			let isDragging = false;
			let dragOffset = { x: 0, y: 0 };

			const bookPages = [
				{
					left: {
						title: "Gaming Community",
						icon: "🎮",
						text: "Over 50,000 passionate gamers have found their digital home, connecting through crystal-clear voice channels and competitive tournaments.",
						stats: ["50,000+ Active Members", "24/7 Voice Channels", "Weekly Tournaments"],
					},
					right: {
						title: "Learning Hub",
						icon: "🎓",
						text: "Educational communities where students and professionals share knowledge, collaborate on projects, and grow together.",
						stats: ["25,000+ Learners", "500+ Study Groups", "Expert Mentorship"],
					},
				},
				{
					left: {
						title: "Creative Studios",
						icon: "🎨",
						text: "Artists, designers, and creators showcase their work, receive feedback, and collaborate on amazing projects.",
						stats: ["15,000+ Creators", "Daily Art Challenges", "Portfolio Reviews"],
					},
					right: {
						title: "Tech Innovation",
						icon: "💻",
						text: "Developers and tech enthusiasts building the future together through code reviews, hackathons, and knowledge sharing.",
						stats: ["30,000+ Developers", "Monthly Hackathons", "Open Source Projects"],
					},
				},
				{
					left: {
						title: "Music & Audio",
						icon: "🎵",
						text: "Musicians, producers, and audio enthusiasts creating, sharing, and discovering new sounds in our vibrant music community.",
						stats: ["20,000+ Musicians", "Live Jam Sessions", "Music Production Tips"],
					},
					right: {
						title: "Global Impact",
						icon: "🌍",
						text: "Together, our communities have created lasting connections, shared knowledge, and built something truly special.",
						stats: ["150,000+ Total Members", "50+ Countries", "24/7 Global Activity"],
					},
				},
				{
					left: {
						title: "Join Us Today",
						icon: "🚀",
						text: "Ready to be part of something amazing? Join MisVord and discover your community today!",
						stats: ["Free to Join", "Instant Access", "Unlimited Possibilities"],
					},
					right: {
						title: "Your Story Next",
						icon: "✨",
						text: "Every great community starts with passionate individuals. Your story could be the next chapter in our success.",
						stats: ["Be Part of History", "Shape the Future", "Create Together"],
					},
				},
			];

			class CharacterScrambler {
				constructor() {
					this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
					this.init();
				}

				init() {
					const mainText = document.getElementById("mainText");
					const originalText = mainText.textContent;

					mainText.innerHTML = originalText
						.split("")
						.map((char) => `<span class="char" data-original="${char}">${char}</span>`)
						.join("");

					const chars = mainText.querySelectorAll(".char");
					chars.forEach((charElement) => {
						charElement.addEventListener("mouseenter", () => this.scrambleChar(charElement));
						charElement.addEventListener("mouseleave", () => this.unscrambleChar(charElement));
					});

					setTimeout(() => this.initialScramble(), 500);
				}

				initialScramble() {
					const chars = document.querySelectorAll(".char");
					chars.forEach((charElement, index) => {
						setTimeout(() => {
							this.scrambleChar(charElement);
							setTimeout(() => this.unscrambleChar(charElement), 1000 + Math.random() * 1000);
						}, index * 100);
					});
				}

				scrambleChar(charElement) {
					const originalChar = charElement.dataset.original;
					let scrambleCount = 0;
					const maxScrambles = 10;

					charElement.classList.add("scrambling");

					const scrambleInterval = setInterval(() => {
						if (scrambleCount < maxScrambles) {
							const randomChar = this.chars[Math.floor(Math.random() * this.chars.length)];
							charElement.textContent = randomChar;
							scrambleCount++;
						} else {
							clearInterval(scrambleInterval);
						}
					}, 50);

					charElement.scrambleInterval = scrambleInterval;
				}

				unscrambleChar(charElement) {
					const originalChar = charElement.dataset.original;

					if (charElement.scrambleInterval) {
						clearInterval(charElement.scrambleInterval);
					}

					charElement.classList.remove("scrambling");
					charElement.textContent = originalChar;
				}
			}

			// Particle system
			function createParticles() {
				const particleContainers = ["particles", "particles2", "particles3"];

				particleContainers.forEach((containerId) => {
					const particlesContainer = document.getElementById(containerId);
					if (!particlesContainer) return;

					const particleCount = 30;

					for (let i = 0; i < particleCount; i++) {
						const particle = document.createElement("div");
						particle.className = "particle";

						particle.style.left = Math.random() * 100 + "%";
						particle.style.top = Math.random() * 100 + "%";
						particle.style.animationDelay = Math.random() * 3 + "s";
						particle.style.animationDuration = Math.random() * 2 + 2 + "s";

						const size = Math.random() * 2 + 1;
						particle.style.width = size + "px";
						particle.style.height = size + "px";

						particlesContainer.appendChild(particle);
					}
				});
			}

			// Feature Card Particles
			function createCardParticles() {
				const featureCards = document.querySelectorAll(".feature-card");

				featureCards.forEach((card) => {
					const particleContainer = card.querySelector(".card-particles");
					const particleCount = 16;

					for (let i = 0; i < particleCount; i++) {
						const particle = document.createElement("div");
						particle.className = "card-particle";

						particle.style.left = Math.random() * 100 + "%";
						particle.style.top = Math.random() * 100 + "%";
						particle.style.animationDelay = Math.random() * 4 + "s";
						particle.style.animationDuration = Math.random() * 2 + 3 + "s";

						particleContainer.appendChild(particle);
					}
				});
			}

			// Scroll to features function
			function scrollToFeatures() {
				document.getElementById("featuresSection").scrollIntoView({
					behavior: "smooth",
				});
			}

			// 3D Card Tilt Effect
			class Card3D {
				constructor() {
					this.cards = document.querySelectorAll(".feature-card");
					this.init();
				}

				init() {
					this.cards.forEach((card) => {
						card.addEventListener("mousemove", (e) => this.handleMouseMove(e, card));
						card.addEventListener("mouseleave", (e) => this.handleMouseLeave(e, card));
						card.addEventListener("mouseenter", (e) => this.handleMouseEnter(e, card));
					});
				}

				handleMouseMove(e, card) {
					const rect = card.getBoundingClientRect();
					const cardWidth = rect.width;
					const cardHeight = rect.height;

					const mouseX = e.clientX - rect.left - cardWidth / 2;
					const mouseY = e.clientY - rect.top - cardHeight / 2;

					// Increased rotation from ±15 to ±30 degrees for more dramatic movement
					const rotateX = (mouseY / cardHeight) * -30;
					const rotateY = (mouseX / cardWidth) * 30;

					// Increased lift and scale for more noticeable effect
					card.style.transform = `translateY(-15px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.08, 1.08, 1.08)`;

					const glowX = (mouseX / cardWidth) * 100 + 50;
					const glowY = (mouseY / cardHeight) * 100 + 50;

					// Enhanced glow effect
					card.style.background = `
						radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.2) 0%, rgba(45, 45, 60, 0.8) 50%),
						rgba(45, 45, 60, 0.8)
					`;
				}

				handleMouseEnter(e, card) {
					card.style.transition = "none";
				}

				handleMouseLeave(e, card) {
					card.style.transition = "all 0.6s ease";
					card.style.transform = "translateY(-5px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
					card.style.background = "rgba(45, 45, 60, 0.8)";

					setTimeout(() => {
						card.style.transition = "all 0.3s ease";
					}, 600);
				}
			}

			// Book functionality with enhanced flip animation
			function nextStory() {
				if (!bookOpened) {
					openBook();
				} else {
					if (currentPage < totalPages - 1) {
						currentPage++;
						updateBookPages();

						// Add enhanced page flip animation
						const leftPage = document.getElementById("leftPage");
						const rightPage = document.getElementById("rightPage");

						leftPage.classList.add("page-flip-left");
						rightPage.classList.add("page-flip-right");

						setTimeout(() => {
							leftPage.classList.remove("page-flip-left");
							rightPage.classList.remove("page-flip-right");
						}, 1200);
					} else {
						// Reset to beginning with flip animation
						currentPage = 0;
						updateBookPages();

						const leftPage = document.getElementById("leftPage");
						const rightPage = document.getElementById("rightPage");

						leftPage.classList.add("page-flip-left");
						rightPage.classList.add("page-flip-right");

						setTimeout(() => {
							leftPage.classList.remove("page-flip-left");
							rightPage.classList.remove("page-flip-right");
						}, 1200);
					}
				}
			}

			function openBook() {
				if (bookOpened) return;

				bookOpened = true;
				const leftPage = document.getElementById("leftPage");
				const rightPage = document.getElementById("rightPage");
				const storiesPage = document.getElementById("storiesPage");
				const leftPageContent = document.getElementById("leftPageContent");

				// Hide stories page and show content pages
				storiesPage.style.display = "none";
				leftPageContent.style.display = "flex";
				rightPage.style.display = "block";

				// Add opened class for mirror effect
				leftPage.classList.add("opened");

				// Add flip animation
				leftPage.classList.add("flipping");
				setTimeout(() => {
					leftPage.classList.remove("flipping");
					updateBookPages();
				}, 600);
			}

			function updateBookPages() {
				const leftPageContent = document.getElementById("leftPageContent");
				const rightPageContent = document.getElementById("rightPageContent");

				const currentPageData = bookPages[currentPage];

				// Update left page (with mirror effect)
				leftPageContent.innerHTML = `
                <div class="page-title">${currentPageData.left.title}</div>
                <div class="page-icon">${currentPageData.left.icon}</div>
                <div class="page-text">${currentPageData.left.text}</div>
                ${
									currentPageData.left.stats
										? `
                    <div class="page-stats">
                        ${currentPageData.left.stats.map((stat) => `<div class="stat-item">${stat}</div>`).join("")}
                    </div>
                `
										: ""
								}
            `;

				// Update right page
				rightPageContent.innerHTML = `
                <div class="page-title">${currentPageData.right.title}</div>
                <div class="page-icon">${currentPageData.right.icon}</div>
                <div class="page-text">${currentPageData.right.text}</div>
                ${
									currentPageData.right.stats
										? `
                    <div class="page-stats">
                        ${currentPageData.right.stats.map((stat) => `<div class="stat-item">${stat}</div>`).join("")}
                    </div>
                `
										: ""
								}
            `;
			}

			// Nitro Interactive System - Fixed for proper hexagon orbit
			class NitroInteractive {
				constructor() {
					this.nitroCenter = document.getElementById("nitroCenter");
					this.nitroInteractive = document.getElementById("nitroInteractive");
					this.hexagons = document.querySelectorAll(".hexagon");
					this.isDragging = false;
					this.dragOffset = { x: 0, y: 0 };
					this.centerPosition = { x: 0, y: 0 };

					this.init();
				}

				init() {
					// Store initial center position
					const rect = this.nitroInteractive.getBoundingClientRect();
					this.centerPosition = {
						x: rect.width / 2,
						y: rect.height / 2,
					};

					// Mouse events for dragging
					this.nitroCenter.addEventListener("mousedown", (e) => this.startDrag(e));
					document.addEventListener("mousemove", (e) => this.drag(e));
					document.addEventListener("mouseup", () => this.endDrag());

					// Touch events for mobile
					this.nitroCenter.addEventListener("touchstart", (e) => this.startDrag(e.touches[0]));
					document.addEventListener("touchmove", (e) => this.drag(e.touches[0]));
					document.addEventListener("touchend", () => this.endDrag());

					// Hover effects - only expand on center hover
					this.nitroCenter.addEventListener("mouseenter", () => this.expandHexagons());
					this.nitroCenter.addEventListener("mouseleave", () => this.contractHexagons());
				}

				startDrag(e) {
					this.isDragging = true;
					const rect = this.nitroCenter.getBoundingClientRect();
					const centerRect = this.nitroInteractive.getBoundingClientRect();

					this.dragOffset = {
						x: e.clientX - rect.left - rect.width / 2,
						y: e.clientY - rect.top - rect.height / 2,
					};

					this.nitroCenter.style.cursor = "grabbing";
					this.pauseHexagonAnimation();
				}

				drag(e) {
					if (!this.isDragging) return;

					const containerRect = this.nitroInteractive.getBoundingClientRect();
					const newX = e.clientX - containerRect.left - this.dragOffset.x - 60;
					const newY = e.clientY - containerRect.top - this.dragOffset.y - 60;

					// Constrain to container bounds
					const maxX = containerRect.width - 120;
					const maxY = containerRect.height - 120;

					const constrainedX = Math.max(0, Math.min(maxX, newX));
					const constrainedY = Math.max(0, Math.min(maxY, newY));

					this.nitroCenter.style.left = constrainedX + "px";
					this.nitroCenter.style.top = constrainedY + "px";

					// Update hexagon positions relative to center
					this.updateHexagonPositions(constrainedX + 60, constrainedY + 60);
				}

				endDrag() {
					if (!this.isDragging) return;

					this.isDragging = false;
					this.nitroCenter.style.cursor = "grab";
					this.resumeHexagonAnimation();
				}

				updateHexagonPositions(centerX, centerY) {
					this.hexagons.forEach((hexagon, index) => {
						const angle = index * 60 * (Math.PI / 180);
						const radius = 120;

						const x = centerX + Math.cos(angle) * radius - 40;
						const y = centerY + Math.sin(angle) * radius - 40;

						hexagon.style.left = x + "px";
						hexagon.style.top = y + "px";
					});
				}

				expandHexagons() {
					this.hexagons.forEach((hexagon) => {
						hexagon.style.animationPlayState = "paused";
						hexagon.style.transform = "scale(1.1) translateX(var(--expand-x)) translateY(var(--expand-y))";
					});
				}

				contractHexagons() {
					this.hexagons.forEach((hexagon) => {
						hexagon.style.animationPlayState = "running";
						hexagon.style.transform = "scale(1)";
					});
				}

				pauseHexagonAnimation() {
					this.hexagons.forEach((hexagon) => {
						hexagon.style.animationPlayState = "paused";
					});
				}

				resumeHexagonAnimation() {
					this.hexagons.forEach((hexagon) => {
						hexagon.style.animationPlayState = "running";
					});
				}
			}

			// Initialize everything when DOM is loaded
			document.addEventListener("DOMContentLoaded", function () {
				new CharacterScrambler();
				createParticles();
				createCardParticles();
				new Card3D();
				new NitroInteractive();
			});

			// Add click handler for login button
			document.querySelector(".login-btn").addEventListener("click", function () {
				alert("Login functionality would be implemented here!");
			});
		</script>
	</body>
</html>