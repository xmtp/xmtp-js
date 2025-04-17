import type { FC } from "react";
import { Button } from "@/content-types/mini-app/components/mantine/components/Button";
import { Container } from "@/content-types/mini-app/components/mantine/components/Container";
import type { Component } from "@/content-types/mini-app/types";
import { Fragment } from "./components/Fragment";
import { Image } from "./components/Image";
import { RowLayout } from "./components/RowLayout";
import { StackLayout } from "./components/StackLayout";
import { Text } from "./components/Text";

type ComponentMap = {
  [K in Component["type"]]: FC<Extract<Component, { type: K }>["props"]>;
};

const components = {
  "row-layout": RowLayout,
  "stack-layout": StackLayout,
  fragment: Fragment,
  container: Container,
  button: Button,
  text: Text,
  image: Image,
} satisfies ComponentMap;

export default components;
