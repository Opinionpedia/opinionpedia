import React, { useState } from "react";
import "../Login/Login.css";
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

const Login = (props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visibility, setVisible] = useState(true);

  const handleChangeUsername = (event) => {
    setUsername(event.target.value);
  };
  const handleChangePassword = (event) => {
    setPassword(event.target.value);
  };
  const handleClose = () => {
    setVisible(false);
  };

  return (
    <div>
      <Overlay
        isOpen={visibility}
        onClose={handleClose}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        autoFocus={true}
      >
        <Card className="Login-card">
          <FormGroup
            helperText="Haven't sign up?"
            label="Log In"
            labelFor="text-input"
            labelInfo=""
          >
            <InputGroup
              id="text-input"
              placeholder="Username"
              value={username}
              onChange={handleChangeUsername}
            />
            <InputGroup
              id="text-input"
              placeholder="Password"
              value={password}
              onChange={handleChangePassword}
            />
          </FormGroup>
          <Button intent="Success" text="Log In" onClick={handleClose}></Button>
        </Card>
      </Overlay>
    </div>
  );
};
export default Login;
