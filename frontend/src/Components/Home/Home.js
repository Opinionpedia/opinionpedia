import React from 'react';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';

import { Button,
         Navbar,
         Alignment,
         FormGroup,
         InputGroup,
         Card 
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";


class Home extends React.Component {

  handleClick() {
    console.log("hi");
  }

  render() {
    return (
      <div> 
        <Card className="">
          <FormGroup
              helperText="Already signed up 'click here'..."
              label="Sign Up"
              labelFor="text-input"
              labelInfo="(required)"  
            >
            <InputGroup id="text-input" placeholder="Username" />
            <InputGroup id="text-input" placeholder="Password" />
            <InputGroup id="text-input" placeholder="Password Confirmation" />
          </FormGroup>
        </Card>
        <Card className="">
          <h1>Hello, World!</h1>
          <Button intent="success" text="button content" onClick={this.handleClick}></Button>
        </Card>
      </div>
    );
  }
}
export default Home;