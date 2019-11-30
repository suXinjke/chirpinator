import React from 'react'
import { hot } from 'react-hot-loader'

import './fonts/fonts.css'
import './icons/css/fontello.css'
import './App.scss'

function formatNumberTime(timeInSeconds = 0) {
    const hours     = Math.floor( timeInSeconds / 3600 ).toString().padStart( 2, "0" )
    const minutes   = Math.floor( ( timeInSeconds / 60 ) % 60 ).toString().padStart( 2, "0" )
    const seconds   = Math.floor( timeInSeconds % 60 ).toString().padStart( 2, "0" )

    return `${hours}:${minutes}:${seconds}`
}

const Timer = ( {
    className = '',
    timeString,
    canPlay,
    canRemove,
    big,
    active,
    onPlay,
    onPause,
    onRemove
} ) => (
    <div className={`timer ${className} ${active ? 'timer_active' : ''} ${big ? 'timer_big' : ''}`.trim()}>
        <div className="timer__time">{ timeString }</div>
    { canRemove &&
        <button
            className="timer__control-button"
            title="Remove task"
            onClick={ onRemove }
        >
            <i className="icon-cancel"/>
        </button>
    }
    { canPlay &&
        <button
            className="timer__control-button"
            title={ active ? 'Pause' : 'Play' }
            onClick={ active ? onPause : onPlay }
        >
            <i className={ active ? 'icon-pause' : 'icon-play' }/>
        </button>
    }
    </div>
)

const PAGE = {
    CHIRPINATOR: 'CHIRPINATOR',
    EXPORT: 'EXPORT',
    SETTINGS: 'SETTINGS'
}

const defaultState = {
    idCounter: 1,
    activeTaskId: null,
    lastActiveTaskId: null,
    tasks: [],
    activePage: PAGE.CHIRPINATOR
}

class App extends React.Component {

    constructor( props ) {
        super( props )

        this.lastTaskRef = React.createRef()
        this.taskListRef = React.createRef()

        const preservedState = localStorage.getItem( 'chirpinatorState' )
        this.state = {
            ...defaultState,
            ...(preservedState ? JSON.parse( preservedState ) : {})
        }
    }

    componentDidMount() {
        setInterval( () => {
            this.setState( ( { activeTaskId, tasks } ) => {
                if ( activeTaskId === null ) {
                    return
                }

                return {
                    tasks: tasks.map( ( task ) => task.id !== activeTaskId ? task : { ...task, seconds: task.seconds + 1 } )
                }
            }, () => {
                localStorage.setItem( 'chirpinatorState', JSON.stringify( this.state ) )
            } )
        }, 1000 )
    }

    addNewTask = () => {
        const { idCounter, tasks } = this.state
        this.setState( {
            tasks: tasks.concat( {
                id: idCounter,
                title: '',
                seconds: 0
            } ),
            idCounter: idCounter + 1
        }, () => {
            const { scrollHeight, clientHeight } = this.taskListRef.current;
            this.taskListRef.current.scrollTop = scrollHeight - clientHeight;
            this.lastTaskRef.current.focus()
        }  )
    }

    render() {
        const { tasks, activeTaskId, lastActiveTaskId, activePage } = this.state

        const totalSeconds = tasks.reduce( ( prev, task ) => prev + task.seconds, 0 )
        const lastActiveTask = tasks.find( task => task.id === lastActiveTaskId )

        return (<React.Fragment>
            <div className="nav">
                {/* <div
                    className={`nav__link${activePage === PAGE.EXPORT ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.EXPORT } ) } }
                >
                    EXPORT
                </div> */}
                <div
                    className={`nav__link${activePage === PAGE.CHIRPINATOR ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.CHIRPINATOR } ) } }
                >
                    CHIRPINATOR
                </div>
                {/* <div
                    className={`nav__link${activePage === PAGE.SETTINGS ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.SETTINGS } ) } }
                >
                    SETTINGS
                </div> */}
            </div>
        { activePage === PAGE.CHIRPINATOR &&
            <div className="tasks page">
                <div className="tasks__tasks-header tasks-header">
                    <div className="tasks-header__overall">Overall time</div>
                    <Timer
                        big
                        timeString={ formatNumberTime( totalSeconds ) }
                        active={activeTaskId === lastActiveTaskId}
                        canPlay={lastActiveTask}
                        onPlay={ () => {
                            this.setState( { activeTaskId: lastActiveTaskId } )
                        } }
                        onPause={ () => {
                            this.setState( { activeTaskId: null } )
                        } }
                    />
                    <div className="tasks-header__active-task">
                        { !lastActiveTask ? 'No task selected' :
                        !lastActiveTask.title ? 'Untitled task' :
                        lastActiveTask.title }
                    </div>
                </div>
                <div className="tasks__list" ref={this.taskListRef}>
                { tasks.map( ( { id, title, seconds }, index ) => (
                    <div key={id} className={`task${id === activeTaskId ? ' task_active' : ''}`}>
                        <input
                            className="task__input"
                            placeholder="Enter the name of task..."
                            value={title}
                            ref={index === tasks.length - 1 ? this.lastTaskRef : null}
                            onChange={ e => {
                                const title = e.target.value
                                this.setState( {
                                    tasks: tasks.map( ( task, taskIndex ) => index !== taskIndex ? task : { ...task, title } )
                                } )
                            } }
                        />
                        <Timer
                            className='task__timer'
                            timeString={formatNumberTime(seconds)}
                            active={activeTaskId === id}
                            canPlay
                            canRemove
                            active={activeTaskId === id}
                            onPlay={ () => {
                                this.setState( { activeTaskId: id, lastActiveTaskId: id } )
                            } }
                            onPause={ () => {
                                this.setState( { activeTaskId: null } )
                            } }
                            onRemove={ () => {
                                this.setState( {
                                    activeTaskId: activeTaskId === id ? null : activeTaskId,
                                    tasks: tasks.filter( ( _, taskIndex ) => index !== taskIndex )
                                } )
                            } }
                        />
                    </div>
                ) ) }
                </div>
                <button className="tasks__add-new-task-button" onClick={ this.addNewTask }>Add new</button>
            </div>
        }
        { activePage === PAGE.EXPORT &&
            <div className="export page">
                <div className="export__content">
                    <h2>Coming soon</h2>
                </div>
            </div>
        }
        { activePage === PAGE.SETTINGS &&
            <div className="settings page">
                <div className="settings__content">
                    <h2>Coming soon</h2>
                </div>

                <h4 className="settings__about">
                    <a href="https://suxin.space">suxin.space</a> | <a href="https://github.com/suXinjke/chirpinator">GitHub</a>
                </h4>
            </div>
        }
        </React.Fragment>)
    }
}

export default hot( module )( App )