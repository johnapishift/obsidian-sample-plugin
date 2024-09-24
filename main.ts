// TourWrapper.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Joyride, {
  ACTIONS,
  STATUS,
  EVENTS,
  Step,
  CallBackProps,
} from "react-joyride";
import { useOnboarding } from "./onboardingChecklist";

const tourConfig: { [key: number]: Step[] } = {
  1: [
    {
      target: ".step1",
      content:
        "To send a Test message start creating a survey by clicking this button",
      disableBeacon: true,
    },
    // Additional steps can be added here
  ],
  2: [
    {
      target: ".element-on-page-2",
      content: "This is the first step on page 2",
    },
  ],
};

type TourState = {
  run: boolean;
  stepIndex: number;
  steps: Step[];
};

export default function TourWrapper(): JSX.Element {
  const { toggleTask, selectedTask } = useOnboarding();
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
    steps: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTask !== 0) {
      setTourState((prevState) => ({
        ...prevState,
        run: true,
        steps: tourConfig[selectedTask],
      }));
      console.log(tourConfig[selectedTask], selectedTask);
    }
  }, [selectedTask]);

  useEffect(() => {
    const savedState = localStorage.getItem("tourState");
    if (savedState) {
      setTourState(JSON.parse(savedState) as TourState);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, step, type, status } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TOUR_END) {
      const newState = {
        ...tourState,
        stepIndex: index + (action === ACTIONS.NEXT ? 1 : -1),
      };
      setTourState(newState);
      // localStorage.setItem("tourState", JSON.stringify(newState));
    }

    console.log(step.target);
    console.log(type);
    if (step.target === ".step2" && type === EVENTS.STEP_AFTER) {
      console.log("success");
      // navigate("/surveyTemplateDashboard");
    } else if (action === ACTIONS.CLOSE) {
      setTourState({ ...tourState, run: false });
    }
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      toggleTask(selectedTask);
      // setTourState({ run: false, stepIndex: 0, steps: [] });
    }
  };

  return (
    <Joyride
      run={tourState.run}
      stepIndex={tourState.stepIndex}
      steps={tourState.steps}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress
    />
  );
}
