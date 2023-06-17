import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import Message from "./component/message";

import { app } from "./firebase";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};
const logoutHandler = () => {
  const unSubscribe = signOut(auth);
  return () => {
    unSubscribe();
  };
};

const App = () => {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divFroScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        url: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setMessage("");
      // scrolles to the new message
      divFroScroll.current.scrollIntoView({ behaviour: "smooth" });
    } catch (err) {
      alert(err);
    }
  };

  useEffect(() => {
    // this is takes Messages and sort the data is asc by createdAt
    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));
    // gives user from db
    const unSubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    //gives messages from db
    const unSubscribeMessages = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });
    return () => {
      unSubscribe();
      unSubscribeMessages();
    };
  }, []);

  return (
    <>
      <Box bg={"red.50"}>
        {user ? (
          <Container h={"100vh"} bg={"white"}>
            <VStack h={"full"}>
              <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
                logout
              </Button>
              <VStack
                h="full"
                w={"full"}
                paddingY={"4 "}
                overflow={"auto"}
                // css={{
                //   "&::-webkit-scrollbar": {
                //     display: "none",
                //   },
                // }}
              >
                {messages.map((item) => (
                  <Message
                    key={item.id}
                    text={item.text}
                    url={item.url}
                    // if message url is same as current user url
                    user={item.uid === user.uid ? "me" : "other"}
                  />
                ))}
                <div ref={divFroScroll}></div>
              </VStack>
              <form style={{ width: "100%" }} onSubmit={submitHandler}>
                <HStack>
                  <Input
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                  />
                  <Button type="Submit">Sends</Button>
                </HStack>
              </form>
            </VStack>
          </Container>
        ) : (
          <VStack h="100vh" justifyContent={"center"}>
            <Button color={"red"} type="Submit" onClick={loginHandler}>
              sign in with Google
            </Button>
          </VStack>
        )}
      </Box>
    </>
  );
};

export default App;
