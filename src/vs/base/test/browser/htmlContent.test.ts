/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as assert from 'assert';
import * as marked from 'vs/base/common/marked/marked';
import { renderMarkdown, renderText, renderFormattedText } from 'vs/base/browser/htmlContentRenderer';
import { DisposableStore } from 'vs/base/common/lifecycle';

suite('HtmlContent', () => {
	const store = new DisposableStore();

	setup(() => {
		store.clear();
	});

	teardown(() => {
		store.clear();
	});

	test('render simple element', () => {
		let result: HTMLElement = renderText('testing');

		assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
		assert.strictEqual(result.textContent, 'testing');
		assert.strictEqual(result.tagName, 'DIV');
	});

	test('render element with class', () => {
		let result: HTMLElement = renderText('testing', {
			className: 'testClass'
		});
		assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
		assert.strictEqual(result.className, 'testClass');
	});

	test('simple formatting', () => {
		let result: HTMLElement = renderFormattedText('**bold**');
		assert.strictEqual(result.children.length, 1);
		assert.strictEqual(result.firstChild!.textContent, 'bold');
		assert.strictEqual((<HTMLElement>result.firstChild).tagName, 'B');
		assert.strictEqual(result.innerHTML, '<b>bold</b>');

		result = renderFormattedText('__italics__');
		assert.strictEqual(result.innerHTML, '<i>italics</i>');

		result = renderFormattedText('this string has **bold** and __italics__');
		assert.strictEqual(result.innerHTML, 'this string has <b>bold</b> and <i>italics</i>');
	});

	test('no formatting', () => {
		let result: HTMLElement = renderFormattedText('this is just a string');
		assert.strictEqual(result.innerHTML, 'this is just a string');
	});

	test('preserve newlines', () => {
		let result: HTMLElement = renderFormattedText('line one\nline two');
		assert.strictEqual(result.innerHTML, 'line one<br>line two');
	});

	test('action', () => {
		let callbackCalled = false;
		let result: HTMLElement = renderFormattedText('[[action]]', {
			actionHandler: {
				callback(content) {
					assert.strictEqual(content, '0');
					callbackCalled = true;
				},
				disposeables: store
			}
		});
		assert.strictEqual(result.innerHTML, '<a href="#">action</a>');

		let event: MouseEvent = <any>document.createEvent('MouseEvent');
		event.initEvent('click', true, true);
		result.firstChild!.dispatchEvent(event);
		assert.strictEqual(callbackCalled, true);
	});

	test('fancy action', () => {
		let callbackCalled = false;
		let result: HTMLElement = renderFormattedText('__**[[action]]**__', {
			actionHandler: {
				callback(content) {
					assert.strictEqual(content, '0');
					callbackCalled = true;
				},
				disposeables: store
			}
		});
		assert.strictEqual(result.innerHTML, '<i><b><a href="#">action</a></b></i>');

		let event: MouseEvent = <any>document.createEvent('MouseEvent');
		event.initEvent('click', true, true);
		result.firstChild!.firstChild!.firstChild!.dispatchEvent(event);
		assert.strictEqual(callbackCalled, true);
	});

	test('escaped formatting', () => {
		let result: HTMLElement = renderFormattedText('\\*\\*bold\\*\\*');
		assert.strictEqual(result.children.length, 0);
		assert.strictEqual(result.innerHTML, '**bold**');
	});
	test('image rendering conforms to default', () => {
		const markdown = { value: `![image](someimageurl 'caption')` };
		const result: HTMLElement = renderMarkdown(markdown);
		const renderer = new marked.Renderer();
		const imageFromMarked = marked(markdown.value, {
			sanitize: true,
			renderer
		}).trim();
		assert.strictEqual(result.innerHTML, imageFromMarked);
	});
	test('image rendering conforms to default without title', () => {
		const markdown = { value: `![image](someimageurl)` };
		const result: HTMLElement = renderMarkdown(markdown);
		const renderer = new marked.Renderer();
		const imageFromMarked = marked(markdown.value, {
			sanitize: true,
			renderer
		}).trim();
		assert.strictEqual(result.innerHTML, imageFromMarked);
	});
	test('image width from title params', () => {
		let result: HTMLElement = renderMarkdown({ value: `![image](someimageurl|width=100 'caption')` });
		assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" width="100"></p>`);
	});
	test('image height from title params', () => {
		let result: HTMLElement = renderMarkdown({ value: `![image](someimageurl|height=100 'caption')` });
		assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" height="100"></p>`);
	});
	test('image width and height from title params', () => {
		let result: HTMLElement = renderMarkdown({ value: `![image](someimageurl|height=200,width=100 'caption')` });
		assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" width="100" height="200"></p>`);
	});
});
