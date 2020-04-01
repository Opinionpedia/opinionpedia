import React from 'react';
import './App.css';
import Home from '../Home/Home';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';

import { Button,
         Navbar,
         Alignment,
         FormGroup,
         InputGroup,
         Icon,
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


export default function App() {
  return (
    <Router>
      <div>
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>Opinionpedia</Navbar.Heading>
            <Navbar.Divider />
            <Link to="/">
              <Button className="bp3-minimal" icon="home" text="Home" />
            </Link>
            <Link to="/about">
              <Button to="/about" className="bp3-minimal" icon="document" text="About Us" />
            </Link>
          </Navbar.Group>
        </Navbar>
        <Navbar>
          <Navbar.Group>
            <Icon icon="key" />
            <Navbar.Divider />
            <Link to="/signup">
              <Button to="/signup" className="bp3-minimal" text="Sign Up" />
            </Link>
            <Link to="/login">
              <Button to="/login" className="bp3-minimal" text="Login" />
            </Link>
            <Link to="/logout">
              <Button to="/logout" disabled className="bp3-minimal" text="Sign Out" />
            </Link>
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function About() {
  return <h2>About</h2>;
}

function Topics() {
  let match = useRouteMatch();

  return (
    <div>
      <h2>Topics</h2>

      <ul>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>
            Props v. State
          </Link>
        </li>
      </ul>

      {/* The Topics page has its own <Switch> with more routes
          that build on the /topics URL path. You can think of the
          2nd <Route> here as an "index" page for all topics, or
          the page that is shown when no topic is selected */}
      <Switch>
        <Route path={`${match.path}/:topicId`}>
          <Topic />
        </Route>
        <Route path={match.path}>
          <h3>Please select a topic.</h3>
        </Route>
      </Switch>
    </div>
  );
}

function Topic() {
  let { topicId } = useParams();
  return <h3>Requested topic ID: {topicId}</h3>;
}

/*
class App extends React.Component {

  handleClick() {
    console.log("hi");
  }

  render() {
    return (
      <div>
       
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
*/