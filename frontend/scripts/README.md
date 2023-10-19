**Why do you need a deploy.ts script if you can do "sui client publish"?**

The main goal of a deploy script is to save important objects and package addresses in a json automatically 
, which can be used in any future code you need. For any non-trivial project, it’s incredibly important,
you will save a lot of time over the long run, especially when you want to modify the contract code. 
We have noticed that if we don’t automate this, we forget to update it ourselves and, in general, waste time debugging.
Depending on how complex the sui move contract is, you may need to do other things as well, 
ie mint tokens to another account and have that second account call some other code. You would want to do this in a deploy script
