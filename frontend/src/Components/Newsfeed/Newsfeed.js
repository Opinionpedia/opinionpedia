import React, { useState } from "react";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "../Newsfeed/Newsfeed.css";
import {
  Button,
  Navbar,
  Alignment,
  FormGroup,
  InputGroup,
  Card,
  Overlay,
  Divider,
  Tag,
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from "react-router-dom";
const getItems = (count) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    content: `Question ${k}`,
  }));

const NewsFeed = (props) => {
  const [items, setItems] = useState(getItems(10));

  return (
    <div>
      {items.map((item, index) => (
        <Card className="News-feed">
          <h3>
            <a href="#">{item.content}</a>
          </h3>
          <Button icon="more" minimal={true} />
          <Divider />
          <Tag>Tag</Tag>
          <Divider />
          <p>{item.content}</p>
        </Card>
      ))}
    </div>
  );
};
export default NewsFeed;
