import { ComponentType } from "react";

interface AuthProps {
  isAuthed: boolean;
}

export const WithAuthentication = <P extends object>(
  WrappingComponent: ComponentType<P & AuthProps>
) => {
  return function Wrapped(props: P) {
    return <WrappingComponent {...props} isAuthed={true} />;
  };
};
