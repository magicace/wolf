#### It's a demo project of pomelo, Werewolf.

The most important improvement is the process control of game flow. every step consisted from **begin()** and **end()**. when enter step, call begin() at first, and wait for a moment or never rest which decide by filed **delay** in object **GameStep**  to call end(). in end() process will decide which is the next step. and then enter the next step,  so and so, loop till the game over.

The event is base on step, it includes many steps, call **this.startEvent(startStep)** in begin(),  and call **this.stopEvent()** in the end() of last step of this event.  in main loop, the event equal to any other step, you can think it as a single step.

refer to:  **EventBase**, **controller**,**Step**,**stepManager**