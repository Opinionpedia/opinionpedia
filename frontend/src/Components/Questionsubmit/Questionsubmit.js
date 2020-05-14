import React, { useState } from "react";
import fetch from "cross-fetch";
import "../Questionsubmit/Questionsubmit.css";
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
  Position,
  TextArea,
  TagInput,
} from "@blueprintjs/core";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from "react-router-dom";

const QuestionSubmit = (props) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [visibility, setVisible] = useState(true);
  const [values, setValues] = useState(["SCIENCE", "STATISTIC", "ECONOMY"]);
  const [tag, setTag] = useState("");
  const handleChangeTitle = (event) => {
    setTitle(event.target.value);
  };

  const register = async () => {
    const user = {
      prompt: title,
      description: text,
    };

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_API}/api/question`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ${token}",
        },
        json: true,
        body: JSON.stringify(user),
      }
    );
    return response.json();
  };
  const handleChangeText = (event) => {
    setText(event.target.value);
  };
  const handleClose = () => {
    setVisible(false);
  };

  const handleChange = (event) => {
    setValues([...values, tag]);
    setTag("");
    console.log(values);
  };
  const handleTagChange = (event) => {
    setTag(event.target.value);
  };
  const removeTag = (e, index) => {
    const array = [...values];
    array.splice(index, 1);
    setValues(array);
    console.log(e);
    console.log(index);
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
        <Card className="Question-card">
          <FormGroup label="Your Question">
            <InputGroup
              id="text-input"
              placeholder="Title"
              value={title}
              onChange={handleChangeTitle}
            />
            <TextArea
              fill={true}
              placeholder="Text"
              value={text}
              onChange={handleChangeText}
            />
            <TagInput
              values={values}
              inputValue={tag}
              onInputChange={handleTagChange}
              onAdd={handleChange}
              onRemove={removeTag}
            ></TagInput>
          </FormGroup>
          <Button intent="Success" text="Create" onClick={register}></Button>
        </Card>
      </Overlay>
    </div>
  );
};
export default QuestionSubmit;
