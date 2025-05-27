import React, { Component } from 'react';
import Video from './components/video'
import './App.css';
import './styles/video.css'
import { BrowserRouter, Route } from 'react-router-dom';
import { goToRoomInput } from './components/goToRoomInput';
class App extends Component {
  render() {
    return (
      <BrowserRouter>
       <React.Fragment>
          <Route path="/videoconf3/" exact component={goToRoomInput}/>
          <Route path="/videoconf3/:roomId" exact component={Video}/>
        </React.Fragment>
      </BrowserRouter>
    )
  }
}

export default App;
