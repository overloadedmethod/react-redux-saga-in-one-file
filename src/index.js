import "./styles.css";
import {
  createStore,
  bindActionCreators,
  combineReducers,
  applyMiddleware,
  compose
} from "redux";
import createSagaMiddleware from "redux-saga";
import { put, fork, take, takeEvery, delay, select } from "redux-saga/effects";
import { Provider, connect } from "react-redux";
import ReactDOM from "react-dom";
import React from "react";
/**
 * COUNTER COMPONENT START
 */
const counter = {
  count: 0
};

const INCREMENT = "INCREMENT";
const DECREMENT = "DECREMENT";
const SET_COUNT = "SET_COUNT";

const INCREMENT_SAGA = "INCREMENT_SAGA";
const DECREMENT_SAGA = "DECREMENT_SAGA";
const SET_COUNT_SAGA = "SET_COUNT_SAGA";

const increment = payload => ({ type: INCREMENT, payload });
const decrement = payload => ({ type: DECREMENT, payload });
const setCount = count => ({ type: SET_COUNT, payload: { count } });

const incrementSaga = payload => ({ type: INCREMENT_SAGA, payload });
const decrementSaga = payload => ({ type: DECREMENT_SAGA, payload });
const setCountSaga = count => ({ type: SET_COUNT_SAGA, payload: { count } });

const counterReducer = (state = counter, { type, payload }) => {
  switch (type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 };
    case DECREMENT:
      return { ...state, count: state.count - 1 };
    case SET_COUNT:
      return { ...state, ...payload };
    default:
      return state;
  }
};

const CounterApp = props => {
  console.log("counter", props);
  const {
    count,
    increment,
    decrement,
    setCount,
    pushToHistory,
    dispatch
  } = props;
  return (
    <div>
      <div>{count}</div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={() => pushToHistory(count)}>Add to history</button>
      <br />
      <button onClick={() => dispatch(incrementSaga())}>Saga +</button>
      <button onClick={() => dispatch(decrementSaga())}>Saga -</button>
      <button onClick={() => dispatch(setCountSaga(0))}>Saga reset</button>
    </div>
  );
};

const mapCounterStateToProps = function(state) {
  return state.counter;
};

function mapDispatchCounterToProps(dispatch) {
  return {
    dispatch,
    ...bindActionCreators(
      {
        increment,
        decrement,
        setCount,
        pushToHistory,
        incrementSaga,
        decrementSaga,
        setCountSaga
      },
      dispatch
    )
  };
}

/**
 * COUNTER COMPONENT EXPORT(Usually)
 */
const ReduxCounterApp = connect(
  mapCounterStateToProps,
  mapDispatchCounterToProps
)(CounterApp);

/**
 * COUNTER COMPONENT END
 */

/**
 * HISTORY COMPONENT START
 */
const history = { history: [] };

const PUSH_TO_HISTORY = "PUSH_TO_HISTORY";
const CLEAR_HISTORY = "CLEAR_HISTORY";

const pushToHistory = payload => ({ type: PUSH_TO_HISTORY, payload });
const clearHistory = payload => ({ type: CLEAR_HISTORY, payload });

const historyReducer = (state = history, { type, payload }) => {
  switch (type) {
    case PUSH_TO_HISTORY:
      return { history: [...state.history, payload] };
    case CLEAR_HISTORY:
      return { history: [] };
    default:
      return state;
  }
};

const HistoryApp = props => {
  console.log("history", props);
  const { history, clearHistory } = props;
  return (
    <div>
      <button onClick={clearHistory}>Clear history</button>
      {history.map((v, i) => (
        <div key={i}>{v}</div>
      ))}
    </div>
  );
};

const mapHistoryStateToProps = function(state) {
  return state.history;
};

function mapDispatchHistoryToProps(dispatch) {
  return {
    dispatch,
    ...bindActionCreators({ clearHistory }, dispatch)
  };
}

/**
 * HISTORY COMPONENT EXPORT(Usually)
 */
const ReduxHistoryApp = connect(
  mapHistoryStateToProps,
  mapDispatchHistoryToProps
)(HistoryApp);
/**
 * HISTORY COMPONENT END
 */

/**
 * ROOT COMPONENT
 */
const rootReducer = combineReducers({
  counter: counterReducer,
  history: historyReducer
});

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__
    ? compose(
        applyMiddleware(sagaMiddleware),
        window.__REDUX_DEVTOOLS_EXTENSION__()
      )
    : applyMiddleware(sagaMiddleware)
);

/**
 * SAGAS START
 */
function* incrementWatchSaga() {
  while (true) {
    yield take(INCREMENT_SAGA);
    yield delay(1000);
    yield put({ type: INCREMENT });
  }
}

function* decrementWatchSaga() {
  const decrement = function*({ payload }) {
    yield delay(1000);
    yield put({ type: DECREMENT });
  };
  yield takeEvery(DECREMENT_SAGA, decrement);
}

function* resetWatchSaga() {
  yield takeEvery(SET_COUNT_SAGA, function*({ payload }) {
    yield delay(1000);
    yield put({ type: SET_COUNT, payload });
  });
}

/**
 * Start of logging routins
 * Pushes actions to history store
 */

function* logHistory() {
  const logAction = function*() {
    const state = yield select();
    yield put({ type: PUSH_TO_HISTORY, payload: state.counter.count });
  };
  yield takeEvery([SET_COUNT, INCREMENT, DECREMENT], logAction);
}
/**
 * End of logging routines
 */

function* rootSaga() {
  yield fork(incrementWatchSaga);
  yield fork(decrementWatchSaga);
  yield fork(resetWatchSaga);
  yield fork(logHistory);
}

sagaMiddleware.run(rootSaga);

/**
 * SAGAS END
 */

const rootElement = document.getElementById("app");
ReactDOM.render(
  <Provider store={store}>
    <ReduxCounterApp />
    <ReduxHistoryApp />
  </Provider>,
  rootElement
);
