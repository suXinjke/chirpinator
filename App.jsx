import React from 'react'
import { hot } from 'react-hot-loader'

import './fonts/fonts.css'
import './icons/css/fontello.css'
import './App.scss'

const TIME_FORMAT = {
    HH_MM_SS: 'HH_MM_SS',
    MM_SS: 'MM_SS',
    H_MM: 'H_MM',
    SS: 'SS'
}

function formatNumberTime( timeInSeconds = 0, timeFormat = TIME_FORMAT.HH_MM_SS ) {
    if ( timeFormat === TIME_FORMAT.SS ) {
        return `${timeInSeconds} sec.`
    }

    const hours   = Math.floor( timeInSeconds / 3600 )
    const minutes = Math.floor( ( timeInSeconds / 60 ) % 60 )
    const seconds = Math.floor( timeInSeconds % 60 )

    switch ( timeFormat ) {
        case TIME_FORMAT.H_MM:
            const hourFraction = ( minutes + ( seconds / 60 ) ) / 60
            return `${(hours+hourFraction).toFixed( 2 )} hrs.`
        case TIME_FORMAT.MM_SS: {
            const paddedSeconds = seconds.toString().padStart( 2, "0" )
            return `${hours * 60 + minutes}:${paddedSeconds}`
        }
        case TIME_FORMAT.HH_MM_SS:
        default: {
            const paddedHours   = hours.toString().padStart( 2, "0" )
            const paddedMinutes = minutes.toString().padStart( 2, "0" )
            const paddedSeconds = seconds.toString().padStart( 2, "0" )
            return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
        }
    }
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

const EXPORT_FORMAT = {
    JSON: 'JSON',
    CSV: 'CSV'
}

const PAGE_WIDTH = {
    FULL: 'FULL',
    WIDE: '1000',
    MEDIUM: '700',
    SHORT: '400'
}

const defaultState = {
    idCounter: 1,
    activeTaskId: null,
    lastActiveTaskId: null,
    tasks: [],

    activePage: PAGE.CHIRPINATOR,

    maxAppWidth: PAGE_WIDTH.SHORT,
    exportFormat: EXPORT_FORMAT.JSON,
    timeFormat: TIME_FORMAT.HH_MM_SS,

    darkMode: false
}

class App extends React.Component {

    constructor( props ) {
        super( props )

        this.lastTaskRef = React.createRef()
        this.taskListRef = React.createRef()
        this.exportContentRef = React.createRef()

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

        window.onkeydown = ( e ) => {
            if ( e.target.tagName !== 'BODY' ) {
                return
            }

            const { activeTaskId, lastActiveTaskId } = this.state
            if ( activeTaskId ) {
                this.setState( { activeTaskId: null } )
            } else {
                this.setState( { activeTaskId: lastActiveTaskId } )
            }
        }

        this.setDarkMode( this.state.darkMode )
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

    export = ( exportFormat ) => {
        const { tasks, timeFormat } = this.state

        switch ( exportFormat ) {
            case EXPORT_FORMAT.CSV: {
                return tasks.map( ( { title, seconds } ) =>
                    `${title.replace( /\|/g, '' )}|${seconds}|${formatNumberTime( seconds, timeFormat )}`
                ).join( '\n' )
            }

            case EXPORT_FORMAT.JSON:
            default: {
                const totalSeconds = tasks.reduce( ( prev, task ) => prev + task.seconds, 0 )
                const formattedTasks = tasks.map( ( { title, seconds } ) => ( {
                    title,
                    seconds,
                    secondsFormatted: formatNumberTime( seconds, timeFormat )
                } ) )
                return JSON.stringify( {
                    tasks: formattedTasks,
                    overall: {
                        seconds: totalSeconds,
                        totalSeconds: formatNumberTime( totalSeconds, timeFormat )
                    }
                }, null, 2 )
            }
        }
    }

    setDarkMode = ( enabled ) => {
        if ( enabled ) {
            document.body.classList.add( 'dark' )
        } else {
            document.body.classList.remove( 'dark' )
        }
    }

    render() {
        const {
            tasks,
            activeTaskId,
            lastActiveTaskId,
            maxAppWidth,
            timeFormat,
            exportFormat,
            activePage,
            darkMode
        } = this.state

        const totalSeconds = tasks.reduce( ( prev, task ) => prev + task.seconds, 0 )
        const lastActiveTask = tasks.find( task => task.id === lastActiveTaskId )

        return (<div id="chirpinator" style={{ maxWidth: maxAppWidth === PAGE_WIDTH.FULL ? '100%' : `${maxAppWidth}px` }}>
            <div className="nav">
                <div
                    className={`nav__link${activePage === PAGE.EXPORT ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.EXPORT } ) } }
                >
                    EXPORT
                </div>
                <div
                    className={`nav__link${activePage === PAGE.CHIRPINATOR ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.CHIRPINATOR } ) } }
                >
                    CHIRPINATOR
                </div>
                <div
                    className={`nav__link${activePage === PAGE.SETTINGS ? ' nav__link_active' : ''}`}
                    onClick={ () => { this.setState( { activePage: PAGE.SETTINGS } ) } }
                >
                    SETTINGS
                </div>
            </div>
        { activePage === PAGE.CHIRPINATOR &&
            <div className="tasks page">
                <div className="tasks__tasks-header tasks-header">
                    <div className="tasks-header__overall">Overall time</div>
                    <Timer
                        big
                        timeString={ formatNumberTime( totalSeconds, timeFormat ) }
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
                            onKeyDown={ e => {
                                if ( e.keyCode === 13 ) {
                                    this.setState( { activeTaskId: id, lastActiveTaskId: id } )
                                    e.target.blur()
                                }
                            } }
                        />
                        <Timer
                            className='task__timer'
                            timeString={formatNumberTime( seconds, timeFormat )}
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
                    <div className="export-dialog">
                        <div className="export-dialog__options">
                            <div
                                className={`export-dialog__option-button${exportFormat === EXPORT_FORMAT.JSON ? ' export-dialog__option-button_active' : ''}`}
                                onClick={ () => this.setState( { exportFormat: EXPORT_FORMAT.JSON } ) }
                            >
                                JSON
                            </div>
                            <div
                                className={`export-dialog__option-button${exportFormat === EXPORT_FORMAT.CSV ? ' export-dialog__option-button_active' : ''}`}
                                onClick={ () => this.setState( { exportFormat: EXPORT_FORMAT.CSV } ) }
                            >
                                CSV
                            </div>
                        </div>
                        <pre
                            key={ exportFormat }
                            className="export-dialog__content"
                            ref={ this.exportContentRef }
                            onClick={ () => {
                                const selection = window.getSelection()
                                const range = document.createRange()
                                range.selectNodeContents( this.exportContentRef.current )
                                selection.removeAllRanges()
                                selection.addRange( range )
                            } }
                        >
                            { this.export( exportFormat ) }
                        </pre>
                    </div>
                </div>
            </div>
        }
        { activePage === PAGE.SETTINGS &&
            <div className="settings page">
                <div className="settings__content">
                    <div className="setting-row">
                        <label htmlFor="timeFormat">Time format</label>
                        <select
                            name="timeFormat"
                            value={ timeFormat }
                            onChange={ e => this.setState( { timeFormat: e.target.value } ) }
                        >
                            <option value={TIME_FORMAT.HH_MM_SS}>Hours:Minutes:Seconds</option>
                            <option value={TIME_FORMAT.MM_SS}>Minutes:Seconds</option>
                            <option value={TIME_FORMAT.H_MM}>Hours.HourFraction</option>
                            <option value={TIME_FORMAT.SS}>Seconds</option>
                        </select>
                    </div>
                    <div className="setting-row">
                        <label htmlFor="pageWidth">Max page width</label>
                        <select
                            name="pageWidth"
                            value={ maxAppWidth }
                            onChange={ e => this.setState( { maxAppWidth: e.target.value } ) }
                        >
                            <option value={PAGE_WIDTH.FULL}>Full width</option>
                            <option value={PAGE_WIDTH.WIDE}>Wide (1000px)</option>
                            <option value={PAGE_WIDTH.MEDIUM}>Medium (700px)</option>
                            <option value={PAGE_WIDTH.SHORT}>Short (400px)</option>
                        </select>
                    </div>
                    <div className="setting-row">
                        <label htmlFor="darkMode">Dark mode</label>
                        <button onClick={ () => {
                            this.setState( { darkMode: !darkMode }, () => {
                                this.setDarkMode( !darkMode )
                            } )
                        } }>
                            { darkMode ? 'ON' : 'OFF' }
                        </button>
                    </div>
                </div>

                <h4 className="settings__about">
                    <a href="https://suxin.space">suxin.space</a> | <a href="https://github.com/suXinjke/chirpinator">GitHub</a>
                </h4>
            </div>
        }
        </div>)
    }
}

export default hot( module )( App )