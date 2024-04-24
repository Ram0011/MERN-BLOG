import { useEffect, useState } from "react";
import Post from "../Post";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("https://mern-blog-9uge.onrender.com/post", { method: "GET" }).then(
      (response) => {
        response.json().then((posts) => {
          setPosts(posts);
        });
      }
    );
  }, []);

  return <>{posts.length > 0 && posts.map((post) => <Post {...post} />)}</>;
}
