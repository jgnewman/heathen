```
 _____ ______  ________    _______     ___________   _____  _____  _________  _____     _____
|   // |   // |       //  /      \\   |           | ||   / ||   / ||       / ||    \   ||   /
|  ||  |  ||  |   ___//  /   //\  \\  | ___   ___ | ||  |  ||  |  ||   ___/  ||     \  ||  |
|  ||  |  ||  |  ||      |  ||  |  || |// |   | \\| ||  |  ||  |  ||  |      ||  |   \ ||  |
|  ----/  ||  |  |---//  |  ----/  ||     |   |     ||  ----/  |  ||   ---/  ||  |\   \||  |
|  ____   ||  |   __//   |   ___   ||     |   |     ||  ____   |  ||   __/   ||  |\\   \|  |
|  ||  |  ||  |  ||      |  ||  |  ||     |   |     ||  |  ||  |  ||  |      ||  | \\   \  |
|  ||  |  ||  |  |----// |  ||  |  ||     |   |     ||  |  ||  |  ||   ----/ ||  |  \\     |
|___\\ |___\\ |______//  |___\\ |___\\    /___\     ||___\ ||___\ ||______/  ||___\  \\_____\

----------------------- A Multi-Paradigm Lisp Dialect for JavaScript ------------------------

```
> Note: Docs currently under development. Npm package not yet published.

### Why create another language targeting JavaScript?

I believe variety is good.  There are some unique ideas in Heathen you won't find anywhere
else and, while I don't demand that everyone use Heathen instead of other tools, I do
hope folks will at least experiment and maybe some of these ideas will be carried into
the future.

### What are some of the advantages?

The JavaScript code generated by Heathen is extremely accessible. It's composed completely
of "good parts" with no "bad parts" and is very nice and clean.  Heathen is almost more
like a preprocessor than a new language in some ways... except it's made up
almost entirely of S expressions.

This, of course, brings me to my next point:  If you've ever been intrigued by languages
like Lisp, Scheme, or Clojure, Heathen can help you familiarize yourself with S expression
syntax without forcing you to program fully in the functional paradigm.  After all,
JavaScript doesn't incorporate tail call optimization so we can't very well do _everything_
with recursion, can we?

Heathen also gives you simple pattern-match syntax, super simple extensible classes, monads, and,
perhaps most interesting of all, the ability to specify which parameters you'd like to
attach arguments to when you make a function call with `-flags` like you have in Bash.

### Haven't you ever heard of ClojureScript?

Haha, of course I have :)  This is not even remotely the same thing.  ClojureScript is awesome
and does a _lot_ of awesome stuff.  However, ClojureScript is also a _lot_ heavier than Heathen
and the generated code is far less accessible given the fact that you have all those different
kinds of data structures and whatnot.

Heathen does not attempt to implement the functional paradigm over JavaScript so you get to
keep things like variable reassignment.  As a result, the generated code is smaller and
easier for someone looking at it to figure out and debug.  It's a different tool for
different kinds of jobs.

### Why'd you call it Heathen?

Because I've done everything in my power to offend the syntactically religious.  OO diehards
should hate it for the S expressions.  Old school Lispers should hate the fact that it's
multi-paradigm.  However, if you enjoy being a heathen, you may enjoy this.

### How do I get started?

Installation
------------

Heathen is an npm package so, provided you already have Node.js and npm, just do one
of these from the command line:

```bash
~$ npm install heathen
```

Or, if you want to install globally:

```bash
~$ npm install heathen -g
```

Usage
-----

The first thing you should know is that Heathen files end with `.hn` or `.heathen`.  I've included
a `.tmLanguage` file you can use for your TextMate-compatible editors in the `/highlighting` directory.

Using Heathen via the command line or as a Node module is easy.  From the command line, here are your
options:

```bash
Usage: heathen [input] [options]

Input: The path to the file containing Heathen code.

Options:

  -v, --version          Display the version of heathen.
  -h, --help             Display help information.
  -o, --output [file]    The path to the file where you want to place compiled code.
  -m, --minify           Set this if you want to minify the code.
  -x, --no-module        Set this if you do not want the output wrapped in a module.

```

So obviously calling `heathen -v` or `heathen -h` will respectively give you the current version and
the help options.

Other than that, you can simply pass it a path specifying an input file.  If you don't specify an
output file with the `-o` flag, Heathen will output compiled code to the std out.  If you do
specify an output file, it will asynchronously write code to that file.  Heathen will minify
your code if you tell it to with the `-m` flag but, if not, it will come out nicely spaced and indented.

By default, Heathen will wrap the compiled output in a module (in other words, an immediate closure.)
However, if you do _not_ want this, set the `-x` flag. In theory, you will almost never want to do this.
One side effect is that code will not be minified or beautified so the only real use for this is probably when
running code within a REPL.

If you want to use Heathen with Node, you have a similar API.  First you'll have to require the
module, of course:

```javascript
var heathen = require('heathen');
```

Then you can call the compiler and pass in an object specifying options for compilation.  For, example:

```javascript
heathen.compile({
  input    : './rawcode.hn',
  output   : './compiledcode.js',
  minify   : true,
  callback : function (err) {
    ...whatever...
  }
});
```

The above example will take the raw code from `./rawcode.hn`, compile it, minify it, and write it
asynchronously to `./compiledcode.js`.  Then, afterward, it will run the callback with any possible
error as an argument.

If you don't specify the `minify` property, the code will be beautified instead.  If you don't
specify the `output` property, the output will go to the console.  If you don't specify
the `input` property, you'll end up with an empty JavaScript module.

There is also one more option not shown in the above example.  If you specify a `modulize` property
and set it to `false`, your compiled output will not be wrapped in a module.

Syntax
------

Here are a few examples of Heathen syntax.  To learn more, read the [docs](http://www.example.com).

### Hello World

```
(fn helloWorld || 'Hello, World!')
(helloWorld)

;=> returns 'Hello, World!'
```

The above example defines a function called `helloWorld` taking no parameters and returning the string
'Hello, World!'.  It then calls the function.

Now let's customize it:

```
(fn hello |name| 'Hello, #{name}!')
(hello 'John')

;=> Returns 'Hello, John!'
```

**Things You Should Know**
- Single line comments start with a semi-colon.
- Invocation is done by wrapping a function name in parentheses.
- Pipes are for specifying parameters.  They are actually syntax sugar for a function call: `(param name)`. Using the call or the pipes will result in the same thing but all manually-defined functions need to include this.
- You can include variables in a string the same way you can with Ruby by using the pound/brace pattern.
- The entire language is composed of lists.  The first item in the list constitutes an invocation of a function. Each subsequent item is an argument passed to the function.
- Functions always return their last sequential value.

### How do I Math?

```
(+ 2 2)
;=> Returns 4

(+ 'x' 'y')
;=> Returns 'xy'

(+ 'x' 4)
;=> Returns 'x4'

(+ 1 2 3 4)
;=> Returns 10

(* 4 (+ 2 3))
;=> Returns 20
```

**Things You Should Know**
- Math is done using polish notation: operator first, followed by operands.
- Parentheses make order of operations easy!
- This is just JavaScript so type-coersion happens.

### Collections & Reassignment

```
; Create an array
(let myList [1 2 3 4 5])

; Create a JSON object
(let myHash {key1 val1 key2 val2})

(at myArray 0)
;=> 1

myHash.key1
;=> val1

(at myHash key2)
;=> val2

(set myList 'foo')
myList
;=> 'foo'

(setKey myHash 'key3' val3)
myHash.key3
;=> val3
```

**Things You Should Know**
- The `let` function declares variables.
- The `set` function reassigns variables.
- The `setKey` function reassigns items in collections. It takes a collection, a property, and a value.
- There is no 'array notation' in Heathen so you have to use the `at` function any place where you would have used it JavaScript to retrieve an item.
- Square brackets create arrays.  This is actually syntax sugar for the `(list 1 2 3 4 5)` function.
- Curly braces create JSON objects (hash tables).  This is actually syntax sugar for the `(hash key1 val1 key2 val2)` function.

### Conditions

```
(let sharksInWater true)

(if sharksInWater
    (go 'home')
  (! sharksInWater)
    (go 'swimming')
  (kill Schroedinger))

;=> calls (go 'home')
;*
 * If there had somehow been sharks in the water and
 * no sharks in the water at the same time, we would
 * have hit the else case and killed Schroedinger.
 *;


(if (all (< 3 4) (> 3 2)) 
    (run some func))
;=> calls run because all statements are true

(if (any (< 3 4) (< 3 2))
    (run some func))
;=> calls run because one statement is true

(if (! (< 4 3) (< 3 2))
    (run some func))
;=> calls run because all statements are false

```

**Things You Should Know**
- The `if` function works like the **if/else if/else** statement in JavaScript.
- Multi line comments begin with `;*` and end with `*;`.
- `if` is a special form. In other words, it's not really a true function call so you don't have to worry about it evaluating all of its arguments before passing them to `if`.  It doesn't do that :)
- The `all` function returns `true` if all arguments are truthy.
- The `any` function returns `true` after evaluating the first truthy argument (because it's a special form).
- The `!` function returns `true` if all arguments are falsy.
- `if` returns a value.
- The statement `(if (< 1 2) (+ 1 2) (- 1 2))` is not much longer than the JavaScript statement `(1 < 2) ? 1 + 2 : 1 - 2;`.

### Iterations

To iterate over any collection, just call `(map)`.

```
(let myArray [1 2 3 4 5])

(map myArray (fn |item index|
  (if
    (= (% index 2) 0)
      (* item 10)
    (item))))

;=> Returns [1 20 3 40 5]
```

**Things You Should Know**
- The `map` function takes a collection and another function.  It calls the function once for each item in the collection.
- The argument function takes the item and its index as parameters.  If iterating over an object, these will refer to value and key.
- Test for positive equality with the `=` function.  This compiles to `===` in JavaScript.
- Also, you can test for negative equality with the `!=` function which compiles to `!==` in JavaScript.

### Blocks

Sometimes it's convenient to be able to group some things together without actually creating a function.

```
(if (someCondition) (do
  (thing 1)
  (thing 2)
  (thing 3)))
;=> If someCondition is truthy, returns the value of (thing 3)
```

**Things You Should Know**
- `do` creates a "block" which is a closure taking no arguments.
- The block is a special form that compiles to an immediately-invoked function.  In this case, it's inside an `if` statement so it won't get invoked before we want it to.

### Atoms

Heathen gives you a convenient way to reference specific, tiny objects whose values will never
change and can never equal any other value.

```
(= @myAtom @myAtom)
;=> true

(= @myAtom anythingElseEver)
;=> false
```

**Things You Should Know**
- Atoms are specified by placing the `@` sign in front of a name.
- You don't have to do anything special to create an atom.  Just reference it.
- Once an atom is created, it is never garbage-collected and never modified.

### Lazy Values

Sometimes it feels like overkill to have to create a full on function just to return one thing.
In Heathen, you can create lazy values instead:

```
; This is annoying but sometimes helpful:
(fn || someValue)

; For example:
(let name 'john'
     obj  {getName (fn || name)})

; Then you can call it:
(obj.getName)
;=> Returns 'john'

; Instead you can create a lazy value by using a colon:
(let name 'john'
     obj  {getName :name})

; Then you can call it the same way:
(obj.getName)
;=> Returns 'john'
```

**Things You Should Know**
- Placing a colon in front of a value makes it lazy.
- When a value is lazy, it means you have to call it in order to actually see its value.
- You can place a colon in front of _anything_ to make it lazy.
- Notice, you can declare multiple variables at once with a single call to `let`.

### Pattern Matching

If you _do_ like functional programming, Heathen contains a simple pattern match syntax
to help you be recursively awesome.

```
(fn factorial (match
  (method [0] 1)
  (method [1] 1)
  (method [n] (* n (factorial (- n 1))))))
```

In this example, the body of the `factorial` function is created with a call to the `match`
function.  `match` calls can only be made up of `method` calls.  Each `method` call creates
an alternate function body depending on the shape of the arguments when they come in.

The first argument you pass to `method` needs to be an array.  That array is where you specify
what the arguments should look like in order to execute the rest of the method.

In the above example the first method expects one argument whose value is `0`.  The second method expects one argument
whose value is `1`.  The last method expects one argument whose value could be anything.

When we call `(factorial 4)`, for example, that `4` will be tested against each method sequentially.
Since it only matches the third method, the third method will be the one executed. This will continue until it
passes in arguments that match a different method.

**Things You Should Know**
- If you need a method to execute multiple calls, you do NOT need to write a `do` block. Each method creates a function taking parameters that match the dynamic values in its argument pattern list.

### Default Arguments

```
(fn foo |x -> 2, y -> 4|
  (+ x y))

(foo 10 20)
;=> Returns 30

(foo)
;=> Returns 6

(foo 3)
;=> Returns 7

(foo undefined 10)
;=> Returns 12
```

**Things You Should Know**
- Use arrows to specify default arguments for parameters.
- If an argument for a parameter comes in as `undefined`, the default will be used instead.
- Commas are treated as whitespace by the compiler.  They are sometimes helpful for readability but are never necessary.

### Bash Style Calls

In the previous section we specified default arguments for our function called `foo`. However, if we wanted
to use the default for only our first argument, we had to pass in the value `undefined`.  It would have been
nice if we could have specified which parameters we wanted to pass in arguments for.  Enter bash style calls:

```
(fn foo |x -> 2, y -> 4|
  (+ x y))

(foo -y 10)
;=> Returns 12
```

**Things You Should Know**
- Use `-` in front of a parameter name to specify that the following value should be passed in for that parameter.
- Bash style calls only work with named, non pattern match functions.

### Classes

Classes are super easy with Heathen.

```
(class Person
  initializer (fn |name| (setKey this 'name' name))
  getName :this.name)

(let kid (new Person 'john'))

(kid.getName)
;=> Returns 'john'


(class Child => Person
  initializer (fn |name age| (setKey this 'name' name)
                             (setKey this 'age' age))
  getAge :this.age)

(let kid2 (new Child 'billy' 4))

(kid2.getName)
;=> Returns 'billy'

(kid2.getAge)
;=> Returns 4
```

**Things You Should Know**
- Classes are defined using the `class` function.
- The first argument for `class` should be the class name or [name => parent] pair.
- The rocket symbol indicates that the class on the left should extend the class on the right.
- Class constructors are defined following the word `initializer`.  All other values are placed into the prototype.
- To learn more about classes, visit the [docs](http://www.example.com).

### Method Chains

In normal JavaScript, you chain methods all the time.  Take jQuery for example.  You might do
something along these lines:

```javascript
$('#selector').fadeOut('fast').fadeIn('slow');
```

...or some such.  Doing the same thing with S expressions gets hairy:

```
((at ((at ($ '#selector') 'fadeOut') 'fast') 'fadeIn') 'slow')
```

So instead you've got some sugar that can make that easier:

```
(&&= ($ 'selector') (fadeOut 'fast') (fadeIn 'slow'))
```

**Things You Should Know**
- The `&&=` function is a special form.  In essence it makes the first call and stores the return.  It then runs the second call in context of that return and replaces the stored return with the new return etc...

### Monads

I'm not going to try to explain monads here.  But, if you already understand monads, feel free to read on.

We _could_ manually build a monad like this:

```
; RETURN function (return is a reserved word in JS so we'll use wrap):
(fn wrap |value| :value)

; BIND function
(fn bind |mvalue, func| (func (mvalue)))

; Make some functions
(fn fn_one   |x| (console.log x) (wrap (+ x 1)))
(fn fn_two   |x| (console.log x) (wrap (+ x 2)))
(fn fn_three |x| (console.log x) (wrap (+ x 3)))

; Create a monad chain
(bind
  (bind
    (bind 
      (wrap 4)
      fn_1) 
    fn_2) 
  fn_3)
```

But the whole purpose of monads is to have sugar, right?  So let's apply some sugar:

```
(>>= bind (wrap 4) fn_1 fn_2 fn_3)
```

So, assuming you have already written your bind and return functions, and assuming the
functions in your chain properly implement return, you can use the `>>=` function call that
chain.  The `>>=` function takes the following arguments:

1. A bind function.
2. A monadic value to be passed along the chain.
3. All subsequent arguments should be the functions included in the chain.


