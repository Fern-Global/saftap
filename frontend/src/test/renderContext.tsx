import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

export const renderContext = <T,>(
  Context: React.Context<T>,
  Provider: React.ComponentType<{ children: React.ReactNode }>
) => {
  let current: T | undefined;
  let renderer: ReactTestRenderer;

  const Probe = () => (
    <Context.Consumer>
      {(value) => {
        current = value;
        return null;
      }}
    </Context.Consumer>
  );

  act(() => {
    renderer = create(
      <Provider>
        <Probe />
      </Provider>
    );
  });

  return {
    get current() {
      if (current === undefined) {
        throw new Error("Context value was not provided");
      }

      return current;
    },
    unmount: () => {
      act(() => renderer.unmount());
    },
  };
};
