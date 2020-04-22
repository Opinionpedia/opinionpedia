import React, { useEffect, useState } from "react";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import {
  Button,
  Navbar,
  Alignment,
  FormGroup,
  InputGroup,
  Card,
  Overlay,
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from "react-router-dom";

const Authenticator = (props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [visibility, setVisible] = useState(true);
  
  const register = async () => {
    const user = {
      username,
      password,
      body: `Body for profile ${username}`,
      description: `Description for profile ${username}`,
    };

   /* const response = await fetch(`${API_ENDPOINT}/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const body = await response.json();
    //do something
  };*/};
    const handleChangeUsername =event =>{
      setUsername(event.target.value);
   };
     const handleChangePassword =event =>{
      setPassword(event.target.value);
    };
     const handleChangeConfPassword =event =>{
      setConfPassword(event.target.value);
    };
    const handleClose =()=>{
        setVisible(false);
    };
  return (
    <Overlay
      isOpen={visibility}
      onClose={handleClose}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      autoFocus={true}
    >
      <Card
        className=""
        style={{
          maxWidth: "500px",
          width: "260px",
          marginTop: "20vh",
          marginLeft: "-130px",
          left: "50%",
        }}
      >
        <FormGroup
          helperText="Never pay anything"
          label="Sign Up"
          labelFor="text-input"
          labelInfo="(required)"
        >
          <InputGroup
          style={{ 
            marginTop:"10px"
            }}
            id="text-input"
            placeholder="Username"
            value={username}
            onChange={handleChangeUsername}
          />
          <InputGroup
          style={{ 
            marginTop:"10px",
            marginBottom:"10px"
            }}
            id="text-input"
            placeholder="Password"
            value={password}
            onChange={handleChangePassword}
          />
          <InputGroup
         
            id="text-input"
            placeholder="Confirm Password"
            value={confPassword}
            onChange={handleChangeConfPassword}
          />
        </FormGroup>
        <Button intent="Success" text="Sign Up" onClick={register}></Button>
      </Card>
    </Overlay>
  );
};
export default Authenticator;
