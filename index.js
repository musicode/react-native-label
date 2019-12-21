'use strict'

import React, {
  PureComponent,
} from 'react'

import {
  View,
  Text,
  Platform,
} from 'react-native'

import PropTypes from 'prop-types'
import * as patternParser from '@musicode/pattern-parser'

let extraTextStyle = null

// android 的 measure 方法返回全是 undefined
let measureMethod = 'measureInWindow'
if (Platform.OS === 'ios') {
  measureMethod = 'measure'
  extraTextStyle = {
    fontFamily: 'PingFangSC-Regular'
  }
}

export default class Label extends PureComponent {

  state = {
    measured: false,
    showAllText: false,
    shouldShowReadMore: false,
  }

  static propTypes = {
    ...Text.propTypes,
    foldable: PropTypes.bool,
    textStyle: Text.propTypes.style,
    renderMoreButton: PropTypes.func,
    renderLessButton: PropTypes.func,
  }

  static defaultProps = {}

  componentDidMount() {

    this.hasMounted = true

    let { foldable } = this.props

    if (!foldable) {
      return
    }

    requestAnimationFrame(() => {

      if (!this.hasMounted) {
        return
      }

      this.refs.text[measureMethod]((x, y, w, h) => {

        if (!this.hasMounted) {
          return
        }

        let fullHeight = h

        this.setState(
          {
            measured: true,
          },
          () => {
            requestAnimationFrame(() => {

              if (!this.hasMounted) {
                return
              }

              this.refs.text[measureMethod]((x, y, w, h) => {

                if (!this.hasMounted) {
                  return
                }

                let limitedHeight = h

                // 怕有小范围数值的偏差
                if (fullHeight - limitedHeight > 5) {
                  this.setState({
                    shouldShowReadMore: true
                  })
                }
                else {
                  this.setState({
                    showAllText: true,
                  })
                }

              })

            })
          }
        )

      })

    })

  }

  componentWillUnmount() {
    this.hasMounted = false
  }

  handleTogglePress = () => {
    this.setState({
      showAllText: !this.state.showAllText
    })
  }

  render() {

    let {
      children,
      style,
      textStyle,
      linkable,

      telText,
      telStyle,
      onTelPress,

      urlText,
      urlStyle,
      onUrlPress,

      emailText,
      emailStyle,
      onEmailPress,

      foldable,
      renderMoreButton,
      renderLessButton,
      numberOfLines,
      ...props
    } = this.props

    let {
      measured,
      showAllText,
      shouldShowReadMore,
    } = this.state

    if (extraTextStyle) {
      if (textStyle) {
        textStyle = [
          extraTextStyle,
          textStyle
        ]
      }
      else {
        textStyle = extraTextStyle
      }
    }

    let textProps = {
      style: textStyle,
      ...props,
    }

    let textRootProps = {
      ...textProps,
      ref: 'text',
    }

    let parseString = function (text, textProps) {
      if (linkable) {
        let tokens = patternParser.parseAll(text)
        if (tokens.length > 1) {
          return (
            <Text
              {...textProps}
            >
              {
                tokens.map((token, index) => {
                  let style, onPress
                  if (token.link) {

                    if (token.type === 'tel') {
                      style = telStyle
                      if (telText) {
                        token.text = telText
                      }
                      if (onTelPress) {
                        onPress = () => {
                          onTelPress(token.link)
                        }
                      }
                    }
                    else if (token.type === 'url') {
                      style = urlStyle
                      if (urlText) {
                        token.text = urlText
                      }
                      if (onUrlPress) {
                        onPress = () => {
                          onUrlPress(token.link)
                        }
                      }
                    }
                    else if (token.type === 'email') {
                      style = emailStyle
                      if (emailText) {
                        token.text = emailText
                      }
                      if (onEmailPress) {
                        onPress = () => {
                          onEmailPress(token.link)
                        }
                      }
                    }

                  }
                  return (
                    <Text
                      key={`${index}-${token.link || token.text}`}
                      style={style}
                      onPress={onPress}
                    >
                      {token.text}
                    </Text>
                  )
                })
              }
            </Text>
          )
        }
      }
      return (
        <Text
          {...textProps}
        >
          {text}
        </Text>
      )
    }

    let toggleButton

    if (foldable) {
      if (!numberOfLines) {
        throw new Error("Label's numberOfLines prop is required.")
      }
      if (measured && !showAllText) {
        textRootProps.numberOfLines = numberOfLines
      }
      if (shouldShowReadMore) {
        toggleButton = showAllText
          ? renderLessButton(this.handleTogglePress)
          : renderMoreButton(this.handleTogglePress)
      }
    }
    else if (numberOfLines) {
      textRootProps.numberOfLines = numberOfLines
    }

    if (typeof children === 'string') {
      children = parseString(children, textRootProps)
    }
    else if (typeof children === 'number') {
      children = parseString('' + children, textRootProps)
    }
    else if (children && children.length > 1) {
      let nodes = []
      for (let i = 0, len = children.length; i < len; i++) {
        let node = children[i]
        if (typeof children[i] === 'string') {
          node = parseString(children[i], textProps)
        }
        else if (typeof children[i] === 'number') {
          node = parseString('' + children[i], textProps)
        }
        if (node) {
          nodes.push(node)
        }
      }
      if (nodes.length > 0) {
        children = (
          <Text
            {...textRootProps}
          >
            {nodes}
          </Text>
        )
      }
    }

    if (!children) {
      return null
    }

    if (style || toggleButton) {
      return (
        <View style={style}>
          {children}
          {toggleButton}
        </View>
      )
    }

    return children

  }
}
