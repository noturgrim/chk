import React, { useState, useRef, useEffect } from "react";
import WarningIcon from "./icons/warning-alert-svgrepo-com.svg";
import { lineWobble } from "ldrs";

lineWobble.register();

function App() {
  const [openSections, setOpenSections] = useState({
    approved: false,
    declined: false,
    errors: false,
  });
  const [cards, setCards] = useState([]);
  const [approvedCards, setApprovedCards] = useState([]);
  const [declinedCards, setDeclinedCards] = useState([]);
  const [errorCards, setErrorCards] = useState([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Waiting for cards...");
  const stopProcessing = useRef(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  const merchants = {
    // api: "CCN 55USD",
    mon: "CVV 74CA",
    wpay: "CCN 20USD",
  };

  useEffect(() => {
    if (isNotificationVisible) {
      const timer = setTimeout(() => {
        setIsNotificationVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isNotificationVisible]);

  const handleClick = (section) => {
    setOpenSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section],
    }));
  };

  const handleInputChange = (event) => {
    const input = event.target.value;
    const formattedCards = input
      .split("\n")
      .map((card) => card.replace(/\s+/g, ""))
      .join("\n");
    setCards(formattedCards.split("\n"));
  };

  const handleDropdownChange = (event) => {
    setDropdownValue(event.target.value);
  };

  const processCard = async (card) => {
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/${dropdownValue}.php`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([card]),
    });

    const responseBody = await response.text();
    console.log("API response:", responseBody);

    if (!response.ok) {
      throw new Error("Failed to process card");
    }

    if (!responseBody) {
      throw new Error("Empty response from server");
    }

    try {
      return JSON.parse(responseBody);
    } catch (error) {
      console.error("Error parsing JSON:", error.message);

      return {
        card: "Invalid Card Data",
        message: "Error Checking Card - Invalid JSON: " + responseBody,
      };
    }
  };

  const handleStart = async () => {
    if (!dropdownValue) {
      setIsNotificationVisible(true);
      return;
    }

    stopProcessing.current = false;
    setApprovedCards([]);
    setDeclinedCards([]);
    setErrorCards([]);
    setMessage("Processing...");
    setStatus("Checking...");

    let remainingCards = [...cards]; // Clone the current cards list

    for (let card of remainingCards) {
      if (stopProcessing.current) {
        setStatus("Stopping...");
        break;
      }
      try {
        const processedCard = await processCard(card);
        if (processedCard[0].status === "approved") {
          setApprovedCards((prevApproved) => [
            ...prevApproved,
            { card: processedCard[0].card, message: processedCard[0].message },
          ]);
          setMessage("APPROVED");
        } else if (processedCard[0].status === "declined") {
          setDeclinedCards((prevDeclined) => [
            ...prevDeclined,
            { card: processedCard[0].card, message: processedCard[0].message },
          ]);
          setMessage("DECLINED");
        } else if (processedCard[0].status === "Error") {
          setErrorCards((prevErrors) => [
            ...prevErrors,
            { card: processedCard[0].card, message: processedCard[0].message },
          ]);
          setMessage("ERROR");
        }

        // Remove the processed card from the remaining cards
        remainingCards = remainingCards.filter((c) => c !== card);
        setCards(remainingCards);
        document.getElementById("cards").value = remainingCards.join("\n");
      } catch (error) {
        console.error("Error processing card:", error);
        setErrorCards((prevErrors) => [
          ...prevErrors,
          { card, message: error.message },
        ]);
        setMessage("Error processing cards");
      }
    }

    if (!stopProcessing.current) {
      setStatus("Checking finished.");
    } else {
      setStatus("Stopped");
    }
  };

  const handleStop = () => {
    stopProcessing.current = true;
    setStatus("Stopping...");
    setMessage("Processing stopped.");
  };

  const toggleBlur = () => {
    setIsBlurred((prevBlurred) => !prevBlurred);
  };

  return (
    <div
      id="cardinput"
      className="flex flex-col items-center h-screen pt-10 min-h-screen"
    >
      {isNotificationVisible && (
        <div className="fixed top-5 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center animate-slide-in">
          <img src={WarningIcon} alt="Warning" className="w-6 h-6 mr-3" />
          <p className="font-regular">Please select a merchant</p>
        </div>
      )}

      <div className="flex flex-row space-x-2 w-full px-10 justify-center ">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => {
              const testCard = "4303063008577938|11|2027|671"; //  test cc
              document.getElementById("cards").value = testCard;
              handleInputChange({ target: { value: testCard } });
            }}
            className="p-1 bg-blue-500 text-white rounded-md text-sm"
          >
            Test Card
          </button>
        </div>
        <textarea
          id="cards"
          rows="10"
          className={`block p-2.5 w-3/4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none ${
            isBlurred ? "blur-sm" : ""
          }`}
          placeholder="Cards"
          onChange={handleInputChange}
        ></textarea>
        <div className="bg-[#2e3847] rounded-lg p-2 text-xs w-52 flex flex-col space-y-2 h-max">
          <div>
            <button
              className="rounded bg-yellow-500 p-1 text-xs font-bold"
              disabled
            >
              Cards
            </button>
            <span className="ml-1 bg-gray-300 p-1 rounded">{cards.length}</span>
          </div>
          <div>
            <button
              className="rounded bg-green-500 p-1 text-xs font-bold"
              disabled
            >
              Approved
            </button>
            <span className="ml-1 bg-gray-300 p-1 rounded">
              {approvedCards.length}
            </span>
          </div>
          <div>
            <button
              className="rounded bg-red-400 p-1 text-xs font-bold"
              disabled
            >
              Declined
            </button>

            <span className="ml-1 bg-gray-300 p-1 rounded">
              {declinedCards.length}
            </span>
          </div>
          <div>
            <button
              className="rounded bg-orange-400 p-1 text-xs font-bold"
              disabled
            >
              Errors
            </button>
            <span className="ml-1 bg-gray-300 p-1 rounded">
              {errorCards.length}
            </span>
          </div>
          <div>
            <button
              className="rounded bg-blue-400 p-1 text-xs font-bold"
              disabled
            >
              Status
            </button>
            <span className="ml-1 bg-gray-300 p-1 rounded">
              {status === "Checking..." ? (
                <>
                  Checking&nbsp;
                  <l-line-wobble
                    size="16"
                    stroke="2"
                    bg-opacity="0.1"
                    speed="1.75"
                    color="black"
                  ></l-line-wobble>
                </>
              ) : (
                status
              )}
            </span>
          </div>
          <div>
            <button
              className="rounded bg-blue-400 p-1 text-xs font-bold"
              disabled
            >
              Merchant
            </button>
            <span className="ml-1 bg-gray-300 p-1 rounded">
              {dropdownValue ? merchants[dropdownValue] : "Select Merchant"}
            </span>
          </div>
          <div className="mt-2">
            <label className="block text-white text-xs font-bold mb-1">
              Choose Merchant
            </label>
            <select
              value={dropdownValue}
              onChange={handleDropdownChange}
              className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select Merchant</option>
              <option value="api" disabled>
                CCN 55USD
              </option>
              <option value="mon">CVV 74CA</option>
              <option value="wpay">CCN 20USD</option>
              {/* Add more options here */}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4" id="startstopbtns">
        <button
          className="btn bg-green-500 hover:bg-green-600 rounded p-2 mr-2 text-xs font-bold"
          onClick={handleStart}
        >
          Start
        </button>
        <button
          className="btn bg-red-500 hover:bg-red-600 rounded p-2 text-xs font-bold"
          onClick={handleStop}
        >
          Stop
        </button>
        <button
          className="btn bg-gray-500 hover:bg-gray-600 rounded p-2 text-xs font-bold ml-2"
          onClick={toggleBlur}
        >
          {isBlurred ? "Unblur" : "Blur"} Cards
        </button>
        <button
          className="btn bg-yellow-500 hover:bg-yellow-600 rounded p-2 ml-2 text-xs font-bold"
          onClick={() =>
            window.open(
              "https://namso-gen.com/?tab=advance&network=random",
              "_blank"
            )
          }
        >
          NamsoGen
        </button>
      </div>

      <div className="flex flex-col items-center w-full px-20 mt-10 flex-grow">
        <div
          className="bg-green-400 rounded-lg p-2 text-xs font-bold w-1/2 cursor-pointer"
          onClick={() => handleClick("approved")}
        >
          <span className="flex justify-between w-full">
            <span>Approved</span> <span>{approvedCards.length}</span>
          </span>
        </div>
        {openSections.approved && (
          <div className="bg-[#29313f] p-4 rounded-lg w-1/2 mt-2">
            {approvedCards.map((card, index) => (
              <p key={index} className="text-sm text-green-500 font-md">
                {card.card} -&gt; {card.message}
              </p>
            ))}
          </div>
        )}
        <div
          className="bg-red-400 rounded-lg p-2 text-xs font-bold w-1/2 mt-4 cursor-pointer"
          onClick={() => handleClick("declined")}
        >
          <span className="flex justify-between w-full">
            <span>Declined</span> <span>{declinedCards.length}</span>
          </span>
        </div>

        {openSections.declined && (
          <div className="bg-[#29313f] p-4 rounded-lg w-1/2 mt-2">
            {declinedCards.map((card, index) => (
              <p key={index} className="text-sm text-red-600">
                {card.card} -&gt; {card.message}
              </p>
            ))}
          </div>
        )}

        <div
          className="bg-orange-400 rounded-lg p-2 text-xs font-bold w-1/2 mt-4 cursor-pointer"
          onClick={() => handleClick("errors")}
        >
          <span className="flex justify-between w-full">
            <span>Errors</span> <span>{errorCards.length}</span>
          </span>
        </div>

        {openSections.errors && (
          <div className="bg-[#29313f] p-4 rounded-lg w-1/2 mt-2 mb-20">
            {errorCards.map((card, index) => (
              <p key={index} className="text-sm text-orange-500">
                {card.card} -&gt; {card.message}
              </p>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-white rounded-lg shadow m-4 dark:bg-gray-800">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2024 Grimhub
          </span>
        </div>
      </footer>
      <div className="p-1"></div>
    </div>
  );
}

export default App;
