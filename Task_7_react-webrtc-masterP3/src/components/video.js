import React from 'react';
import VideoCall from '../helpers/simple-peer';
import '../styles/video.css';
import '../styles/chat.css';
import io from 'socket.io-client';
import { getDisplayStream } from '../helpers/media-access';
import ShareScreenIcon from './ShareScreenIcon';
class Video extends React.Component {
  constructor() {
    super();
    this.state = {
      localStream: {},
      remoteStreamUrl: '',
      streamUrl: '',
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true,
      chatReady: false,           // enable send-button only when DC is up
      messageInput: '',           // current text box value
      messages: []                // chat history
    };
  }

  videoCall = new VideoCall();

  componentDidMount() {
    const socket = io(process.env.REACT_APP_SIGNALING_SERVER);
    const component = this;
    this.setState({ socket });
    const { roomId } = this.props.match.params;
    this.getUserMedia().then(() => {
      socket.emit('join', { roomId: roomId });
    });
    socket.on('init', () => {
      component.setState({ initiator: true });
    });
    socket.on('ready', () => {
      component.enter(roomId);
    });
    socket.on('desc', data => {
      if (data.type === 'offer' && component.state.initiator) return;
      if (data.type === 'answer' && !component.state.initiator) return;
      component.call(data);
    });
    socket.on('disconnected', () => {
      component.setState({ initiator: true });
    });
    socket.on('full', () => {
      component.setState({ full: true });
    });
  }

  getUserMedia(cb) {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
      const op = {
        video: {
          width: { min: 160, ideal: 640, max: 1280 },
          height: { min: 120, ideal: 360, max: 720 }
        },
        audio: true
      };
      navigator.getUserMedia(
        op,
        stream => {
          this.setState({ streamUrl: stream, localStream: stream });
          this.localVideo.srcObject = stream;
          resolve();
        },
        () => {}
      );
    });
  }

  getDisplay() {
    getDisplayStream().then(stream => {
      stream.oninactive = () => {
        this.state.peer.removeStream(this.state.localStream);
        this.getUserMedia().then(() => {
          this.state.peer.addStream(this.state.localStream);
        });
      };
      this.setState({ streamUrl: stream, localStream: stream });
      this.localVideo.srcObject = stream;
      this.state.peer.addStream(stream);
    });
  }

  enter = roomId => {
    this.setState({ connecting: true });
    const peer = this.videoCall.init(
      this.state.localStream,
      this.state.initiator
    );
    this.setState({ peer });

    peer.on('connect', () => this.setState({ chatReady: true }));
    peer.on('data', data => {
      this.setState(prev => ({
        messages: [...prev.messages, { from: 'peer', text: data.toString() }]
      }));
    });

    peer.on('signal', data => {
      const signal = {
        room: roomId,
        desc: data
      };
      this.state.socket.emit('signal', signal);
    });
    peer.on('stream', stream => {
      this.remoteVideo.srcObject = stream;
      this.setState({ connecting: false, waiting: false });
    });
    peer.on('error', function(err) {
      console.log(err);
    });
  };

  call = otherId => {
    this.videoCall.connect(otherId);
  };

  sendMessage = () => {
    const { messageInput, peer } = this.state;
    if (!messageInput.trim() || !peer?.connected) return;

    peer.send(messageInput);
    this.setState(prev => ({
      messages: [...prev.messages, { from: 'me', text: messageInput }],
      messageInput: ''
    }));
  };

  renderFull = () => {
    if (this.state.full) {
      return 'The room is full';
    }
  };

  render() {
    return (
      <div className='video-wrapper'>
        <div className='local-video-wrapper'>
          <video
            autoPlay
            id='localVideo'
            muted
            ref={video => (this.localVideo = video)}
          />
        </div>
        <video
          autoPlay
          className={`${
            this.state.connecting || this.state.waiting ? 'hide' : ''
          }`}
          id='remoteVideo'
          ref={video => (this.remoteVideo = video)}
        />
        <button
          className='share-screen-btn'
          onClick={() => {
            this.getDisplay();
          }}
        >
          <ShareScreenIcon />
        </button>
        {this.state.connecting && (
          <div className='status'>
            <p>Establishing connection...</p>
          </div>
        )}
        {this.state.waiting && (
          <div className='status'>
            <p>Waiting for someone...</p>
          </div>
        )}
        {this.renderFull()}
         <div className='chat-wrapper'>
          <div className='messages'>
            {this.state.messages.map((m, i) =>
              <div key={i} className={`message ${m.from}`}>{m.text}</div>
            )}
          </div>

          <form
            className='input-row'
            onSubmit={e => { e.preventDefault(); this.sendMessage(); }}
          >
            <input
              value={this.state.messageInput}
              onChange={e => this.setState({ messageInput: e.target.value })}
              placeholder='Type a message…'
            />
            <button type='submit' disabled={!this.state.chatReady}>Send</button>
          </form>
        </div>
      </div>
    );
  }
}

export default Video;
