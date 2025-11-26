'use client';
import { useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useTexture, Environment, Lightformer, Box, Text } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

export default function Lanyard({ position = [0, 0, 20], gravity = [0, -40, 0], fov = 45, transparent = true }) {
  const [isChatMode, setIsChatMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm JC's AI agent. How can I help you today?", sender: "agent", timestamp: new Date(), isTyping: false }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    
    const userQuery = inputMessage;
    const newMessage = {
      id: Date.now(),
      text: userQuery,
      sender: "user",
      timestamp: new Date(),
      isTyping: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    setIsTyping(true);
    
    try {
      // Call the actual chatbot API via proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }
      
      const data = await response.json();
      const responseText = data.response || "Sorry, I couldn't process your request.";
      
      setIsTyping(false);
      const agentResponse = {
        id: Date.now() + 1,
        text: responseText,
        displayText: "", // Text being displayed during typing
        sender: "agent",
        timestamp: new Date(),
        isTyping: true // Mark as typing to trigger animation
      };
      setMessages(prev => [...prev, agentResponse]);
      
      // Start typing animation
      startTypingAnimation(agentResponse.id, responseText);
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      setIsTyping(false);
      
      // Show error message to user
      const errorResponse = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        displayText: "",
        sender: "agent",
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, errorResponse]);
      startTypingAnimation(errorResponse.id, errorResponse.text);
    }
  };

  const startTypingAnimation = (messageId, fullText) => {
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        currentIndex++;
        const displayText = fullText.substring(0, currentIndex);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, displayText } 
            : msg
        ));
        
        typingTimeoutRef.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        // Typing complete
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTyping: false } 
            : msg
        ));
      }
    };
    
    typeNextChar();
  };

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const getAgentResponse = (userMessage) => {
    const responses = [
      "That's an interesting question! I'm JC's AI assistant and I'd love to help you with that.",
      "Welcome to JC's creative space! I'd be happy to assist you with your portfolio needs.",
      "Based on your inquiry about JC's work, I can provide you with detailed information.",
      "Great question! Let me walk you through JC's portfolio and expertise.",
      "I understand what you're looking for regarding JC's services. Here's what I can tell you...",
      "That's a common question about JC's creative work. Here's my take on it...",
      "I can definitely help you learn more abouto JC's portfolio and capabilities. Let me explain...",
      "JC's studio specializes in creative solutions. How can I help you explore our services?",
      "Thanks for your interest in JC's work! I'm here to provide you with all the details you need."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`lanyard-wrapper ${isChatMode ? 'chat-mode' : ''} ${isMobile && isChatMode ? 'mobile-chat' : ''}`}>
      {/* Canvas Container - Hidden on mobile when in chat mode */}
      {(!isMobile || !isChatMode) && (
        <div className={`canvas-container ${isChatMode && !isMobile ? 'split-view' : ''}`}>
        <Canvas
          camera={{ position: position, fov: fov }}
          gl={{ alpha: transparent }}
          onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={Math.PI} />
          <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2.5} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.3} penumbra={1} intensity={2} />
          <pointLight position={[0, 5, 8]} intensity={1.5} color="#667eea" />
          <Physics gravity={gravity} timestep={1 / 60}>
            <Band />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Canvas>
      </div>
      )}

      {/* Chat Container */}
      {isChatMode && (
        <div className="chat-container">
          <div className="chat-header">
            {isMobile && (
              <button 
                className="back-btn cursor-target"
                onClick={() => setIsChatMode(false)}
              >
                ← Back
              </button>
            )}
            <h3>JC's Agent</h3>
            {!isMobile && (
              <button 
                className="close-chat-btn cursor-target"
                onClick={() => setIsChatMode(false)}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'agent-message'}`}
              >
                <div className="message-content">
                  {message.sender === 'agent' && message.isTyping ? (
                    <>
                      {message.displayText}
                      <span className="typing-cursor">|</span>
                    </>
                  ) : (
                    message.text
                  )}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message agent-message">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="chat-input cursor-target"
                autoFocus
              />
              <div className="input-hint">Press Enter to send</div>
            </div>
            <button 
              onClick={handleSendMessage}
              className="send-btn cursor-target"
              disabled={!inputMessage.trim()}
            >
              <span className="send-text">Send</span>
              <span className="send-icon">→</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {!isChatMode && (
        <div className="action-buttons">
          <button 
            className="action-btn primary cursor-target"
            onClick={() => window.open('/portfolio', '_blank')}
          >
            <span>View Portfolio</span>
          </button>
          <button 
            className="action-btn secondary cursor-target"
            onClick={() => setIsChatMode(true)}
          >
            <span>Talk with My Agent</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0 }) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const borderRef = useRef();
  const cornerRefs = useRef([]);
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  
  
  const lanyardTexture = useTexture('/assets/lanyard/lanyard.png');
  
  
  const ropeTexture = new THREE.CanvasTexture((() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 256);
    
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    
    for (let i = 0; i < 1024; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 256);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(i + 6, 0);
      ctx.lineTo(i + 22, 256);
      ctx.stroke();
    }
    
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1024; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, 256);
      ctx.lineTo(i + 16, 0);
      ctx.stroke();
    }
    
    return canvas;
  })());
  
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);
  const [isSmall, setIsSmall] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1.5]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1.5]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1.5]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmall(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useFrame((state, delta) => {
    // Animate border glow
    const time = state.clock.getElapsedTime();
    const pulseIntensity = Math.sin(time * 2) * 0.2 + 0.8; // Pulsing between 0.6 and 1.0
    
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current && band.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      
      // Get the anchor position and offset to the bottom of the hook ring
      const anchorPos = fixed.current.translation();
      const hookBottomPos = new THREE.Vector3(anchorPos.x, anchorPos.y - 0.2, anchorPos.z);
      
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(hookBottomPos);
      band.current.geometry.setPoints(curve.getPoints(48));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  ropeTexture.wrapS = ropeTexture.wrapT = THREE.RepeatWrapping;
  
  // Configure the lanyard texture
  if (lanyardTexture) {
    lanyardTexture.wrapS = lanyardTexture.wrapT = THREE.ClampToEdgeWrapping;
    lanyardTexture.flipY = true;
    lanyardTexture.center.set(0.5, 0.5);
    lanyardTexture.rotation = 0;
  }

  return (
    <>
      <group position={[0, 8, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" position={[0, 0, 0]}>
          {/* Ceiling Mount Base */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 0.15, 32]} />
            <meshStandardMaterial 
              color="#2a2a2a" 
              metalness={0.95} 
              roughness={0.15}
              envMapIntensity={1.5}
            />
          </mesh>
          
          {/* Hook Ring */}
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.05, 16, 32]} />
            <meshStandardMaterial 
              color="#1a1a1a" 
              metalness={0.98} 
              roughness={0.1}
              envMapIntensity={2}
            />
          </mesh>
          
          {/* Decorative Cap */}
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial 
              color="#3a3a3a" 
              metalness={0.9} 
              roughness={0.2}
              envMapIntensity={1.2}
            />
          </mesh>
          
          <BallCollider args={[0.15]} />
        </RigidBody>
        <RigidBody position={[-0.2, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.15]} />
        </RigidBody>
        <RigidBody position={[-0.4, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.15]} />
        </RigidBody>
        <RigidBody position={[-0.6, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.15]} />
        </RigidBody>
        <RigidBody position={[-0.8, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[1.2, 1.6, 0.02]} />
          <group
            scale={3.5}
            position={[0, -1.5, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            {/* Card with different front and back */}
            <mesh scale={[-1, 1, 1]}>
              <boxGeometry args={[1.6, 2.25, 0.02]} />
              <meshPhysicalMaterial
                attach="material-0"
                color="#f0f0f0"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.8}
              />
              <meshPhysicalMaterial
                attach="material-1"
                color="#f0f0f0"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.8}
              />
              <meshPhysicalMaterial
                attach="material-2"
                color="#f0f0f0"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.8}
              />
              <meshPhysicalMaterial
                attach="material-3"
                color="#f0f0f0"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.8}
              />
              {/* Front face with your image */}
              <meshPhysicalMaterial
                attach="material-4"
                map={lanyardTexture}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.2}
              />
              {/* Back face with white background for text */}
              <meshPhysicalMaterial
                attach="material-5"
                color="#f0f0f0"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>
            
            {/* Add PORTFOLIO text to the back */}
            <Text
              position={[0, 0.3, -0.02]}
              fontSize={0.12}
              color="#333"
              anchorX="center"
              anchorY="middle"
              rotation={[0, Math.PI, 0]}
              letterSpacing={0.08}
            >
              PORTFOLIO
            </Text>
            <Text
              position={[0, 0, -0.02]}
              fontSize={0.15}
              color="#1a1a1a"
              anchorX="center"
              anchorY="middle"
              rotation={[0, Math.PI, 0]}
              letterSpacing={0.02}
              fontWeight={700}
            >
              AMBATI JAYA CHARAN
            </Text>
            <Text
              position={[0, -0.4, -0.02]}
              fontSize={0.08}
              color="#666"
              anchorX="center"
              anchorY="middle"
              rotation={[0, Math.PI, 0]}
              letterSpacing={0.1}
            >
              AI ENGINEER
            </Text>
            
            {/* Decorative Lines - Back */}
            <mesh position={[0, 0.17, -0.016]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[1.2, 0.003, 0.001]} />
              <meshStandardMaterial color="#667eea" metalness={0.9} roughness={0.1} emissive="#667eea" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, -0.2, -0.016]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[1.2, 0.003, 0.001]} />
              <meshStandardMaterial color="#667eea" metalness={0.9} roughness={0.1} emissive="#667eea" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Border Frame - Back Side (Only edges) */}
            {/* Top Border */}
            <mesh position={[0, 1.125, -0.015]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[1.6, 0.02, 0.001]} />
              <meshStandardMaterial 
                color="#667eea"
                metalness={0.9}
                roughness={0.1}
                emissive="#667eea"
                emissiveIntensity={hovered ? 0.6 : 0.4}
              />
            </mesh>
            {/* Bottom Border */}
            <mesh position={[0, -1.125, -0.015]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[1.6, 0.02, 0.001]} />
              <meshStandardMaterial 
                color="#667eea"
                metalness={0.9}
                roughness={0.1}
                emissive="#667eea"
                emissiveIntensity={hovered ? 0.6 : 0.4}
              />
            </mesh>
            {/* Left Border */}
            <mesh position={[-0.8, 0, -0.015]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 2.25, 0.001]} />
              <meshStandardMaterial 
                color="#667eea"
                metalness={0.9}
                roughness={0.1}
                emissive="#667eea"
                emissiveIntensity={hovered ? 0.6 : 0.4}
              />
            </mesh>
            {/* Right Border */}
            <mesh position={[0.8, 0, -0.015]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 2.25, 0.001]} />
              <meshStandardMaterial 
                color="#667eea"
                metalness={0.9}
                roughness={0.1}
                emissive="#667eea"
                emissiveIntensity={hovered ? 0.6 : 0.4}
              />
            </mesh>
            
            {/* Corner Accents - Back (mirrored) */}
            <mesh position={[-0.72, 1.05, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.15, 0.02, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-0.77, 1.0, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 0.15, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.72, 1.05, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.15, 0.02, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.77, 1.0, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 0.15, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-0.72, -1.05, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.15, 0.02, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-0.77, -1.0, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 0.15, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.72, -1.05, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.15, 0.02, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.77, -1.0, -0.017]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[0.02, 0.15, 0.001]} />
              <meshStandardMaterial color="#764ba2" metalness={1} roughness={0} emissive="#764ba2" emissiveIntensity={0.6} />
            </mesh>
            
            {/* Clip/attachment holder on the back side */}
            <Box args={[0.15, 0.6, 0.04]} position={[0, 0.8, -0.03]}>
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </Box>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isSmall ? [window.innerWidth, window.innerHeight] : [1920, 1080]}
          useMap
          map={ropeTexture}
          repeat={[-4, 1]}
          lineWidth={isSmall ? 1.8 : 1.2}
          opacity={0.98}
          transparent={true}
        />
      </mesh>
    </>
  );
}