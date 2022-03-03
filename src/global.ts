import os from 'os'
import path from 'path'
import kleur from 'kleur'
import axios from 'axios'
import fs from 'fs-extra'
import YAML from 'yaml'
import * as glob from 'globby'
import { style } from 'kleur-template'
import { io, read, write } from './io'
import { template } from './template'
import {
    $,
    argv,
    cd,
    nothrow,
    sleep,
} from './index'

export function registerGlobals() {
    Object.assign(global, {
        $,
        argv,
        cd,
        kleur,
        axios,
        fs,
        glob,
        nothrow,
        os,
        path,
        sleep,
        YAML,
        io,
        read,
        write,
        template,
        style
    })
}
