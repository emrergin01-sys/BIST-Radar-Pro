import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
test('dashboard inline JavaScript parses',()=>{const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];assert.ok(scripts.length);for(const s of scripts)new vm.Script(s[1]);});
test('dashboard contains core modules and data warning',()=>{for(const id of ['overview','portfolio','watch','sources','reports']) assert.match(html,new RegExp('id="'+id+'"'));assert.match(html,/CANLI VERİ DEĞİL/);assert.match(html,/sunucuya gönderilmedi/);});
test('no hardcoded personal trade data or secrets in public page',()=>{assert.doesNotMatch(html,/4\.982,20|melekcin0@gmail|api[_-]?key\s*[:=]/i)});
