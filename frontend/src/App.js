import React from 'react';
import './App.css';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';

import { Button, Navbar, Alignment, FormGroup, InputGroup, Card } from "@blueprintjs/core";

class App extends React.Component {

  handleClick() {
    console.log("hi");
  }

  render() {
    return (
      <div>
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>Blueprint</Navbar.Heading>
            <Navbar.Divider />
            <Button className="bp3-minimal" icon="home" text="Home" />
            <Button className="bp3-minimal" icon="document" text="Files" />
          </Navbar.Group>
        </Navbar>
        <Card>
          <FormGroup
              helperText="Helper text with details..."
              label="Label A"
              labelFor="text-input"
              labelInfo="(required)"
          >
              <InputGroup id="text-input" placeholder="Placeholder text" />
          </FormGroup>
        </Card>

        <h1>Hello, World!</h1>
        <Button intent="success" text="button content" onClick={this.handleClick}></Button>
      </div>
    );
  }
}
export default App;
