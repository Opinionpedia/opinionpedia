import React from 'react';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';

import { Button,
         Navbar,
         Alignment,
         FormGroup,
         InputGroup,
         Card,
         Overlay
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";

class Authenticator extends React.Component {
  constructor(props){
    super(props);
    this.state = {username: '', password: '', confPassword: ''}
    this.handleClick = this.handleClick.bind(this);
    this.handleChangeUsername = this.handleChangeUsername.bind(this);
    this.handleChangePassword = this.handleChangePassword.bind(this);
    this.handleChangeConfPassword = this.handleChangeConfPassword.bind(this);
  }

  handleChangeUsername(event){
    this.setState({username: event.target.value});
  }
  handleChangePassword(event){
    this.setState({password: event.target.value});
  }
  handleChangeConfPassword(event){
    this.setState({confPassword: event.target.value});
  }

  async handleClick() {
    console.log(process)
    console.log(this.state.username)
    var obj = {
      username: this.state.username,
      password: this.state.password,
      body: "Body for profile " +  this.state.username,
      description: "Description for profile " + this.state.username
    };
    const response = await fetch(`${process.env.REACT_APP_BACKEND_API}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json:true,
      body: JSON.stringify(obj)
    });
    return response.json();
  }

  render() {
    return (
      <Overlay 
        isOpen={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        autoFocus={true}
      >
        <Card className="" style={{maxWidth:'500px', width:'260px', marginTop:'20vh', marginLeft:'-130px', left:'50%'}}
>
          <FormGroup
              helperText="Never pay anything"
              label="Sign Up"
              labelFor="text-input"
              labelInfo="(required)"  
            >
            <InputGroup id="text-input" placeholder="Username" value={this.state.username} onChange={this.handleChangeUsername}/>
            <InputGroup id="text-input" placeholder="Password" value={this.state.password} onChange={this.handleChangePassword}/>
            <InputGroup id="text-input" placeholder="Confirm Password" value={this.state.confPassword} onChange={this.handleChangeConfPassword}/>
          </FormGroup>
          <Button intent="Success" text="Sign Up" onClick={this.handleClick}></Button>
        </Card>
      </Overlay>
    );
  }
}
export default Authenticator;

