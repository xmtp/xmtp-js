import type { Component } from "@xmtp/content-type-mini-app";
import type { ComponentMap } from "@xmtp/content-type-mini-app/react";
import { Button } from "./components/Button";
import { Container } from "./components/Container";
import { Fragment } from "./components/Fragment";
import { Image } from "./components/Image";
import { Input } from "./components/Input";
import { RowLayout } from "./components/RowLayout";
import { StackLayout } from "./components/StackLayout";
import { Text } from "./components/Text";

const componentMap = {
  "row-layout": RowLayout,
  "stack-layout": StackLayout,
  fragment: Fragment,
  container: Container,
  button: Button,
  text: Text,
  image: Image,
  input: Input,
} satisfies ComponentMap<Component>;

export default componentMap;
