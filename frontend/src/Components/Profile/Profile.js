import React, { useState } from "react";
import fetch from "cross-fetch";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import {
  Button,
  Navbar,
  Alignment,
  FormGroup,
  InputGroup,
  Drawer,
  ButtonGroup,
  Divider,
  Position,
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from "react-router-dom";

const Profile = (props) => {
  const [visibility, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <Drawer
      isOpen={visibility}
      onClose={handleClose}
      position={Position.LEFT}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      autoFocus={true}
    >
      <ButtonGroup minimal={true} vertical={true}>
        <Button text="File" />
        <Button text="Edit" />
        <Divider />
        <Button text="Create" />
        <Button text="Delete" />
        <Divider />
        <Button icon="add" />
        <Button icon="remove" />
      </ButtonGroup>
    </Drawer>
  );
};
export default Profile;
