interface Link {
  id: string;
  url: string;
}
interface Props {
  links: Link[];
}
export const Navbar = (props: Props) => {
  return (
    <nav>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {props.links.map((link) => (
          <li key={link.id}>
            <a href={link.url}>{link.id}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
