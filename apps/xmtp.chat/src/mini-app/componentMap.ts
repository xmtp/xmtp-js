import type { Component } from "@xmtp/content-type-mini-app";
import type { ComponentMap } from "@xmtp/content-type-mini-app/react";
import { Button } from "./components/Button";
import { Chrome } from "./components/Chrome";
import { Container } from "./components/Container";
import { Fragment } from "./components/Fragment";
import { Image } from "./components/Image";
import { Input } from "./components/Input";
import { Layout } from "./components/Layout";
import { Text } from "./components/Text";

const componentMap = {
  layout: Layout,
  fragment: Fragment,
  container: Container,
  button: Button,
  text: Text,
  image: Image,
  input: Input,
  chrome: Chrome,
} satisfies ComponentMap<Component>;

export default componentMap;
