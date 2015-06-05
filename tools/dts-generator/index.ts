///<reference path="../../node_modules/typescript/bin/typescript.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
import * as glob from "glob";
import * as ts from "typescript";

export class DtsGenerator {
	private static compilerOptions: ts.CompilerOptions = {
		allowNonTsExtensions: false,
		target: ts.ScriptTarget.ES6
	};
	
	private program: ts.Program;
	private checker: ts.TypeChecker;
	public rootExportedSymbols: {[fqSymbol:string]: ts.Declaration} = {};
	public renderedDts: string = '';
	
	constructor(basePath: string, patterns: string[]) {	
		var filePaths = [];
	    patterns.forEach(function(sourcePattern) {
	      filePaths = filePaths.concat(glob.sync(sourcePattern, { cwd: basePath }));
	    });
		this.program = ts.createProgram(filePaths, DtsGenerator.compilerOptions);
		this.checker = this.program.getTypeChecker();
	}
  
	traverseExports(rootModule: string) {
		let f: ts.SourceFile = this.program.getSourceFile(rootModule + ".ts");
		//let sourceFileSymbol = this.tc.getSymbolAtLocation(f);
		let sourceFileSymbol: ts.Symbol = (<any>f).symbol;
		sourceFileSymbol && this.checker.getExportsOfModule(sourceFileSymbol)
		  .forEach((xport: ts.Symbol) => {
			  console.log('found symbol', xport.getName());
			if (xport.flags & ts.SymbolFlags.Alias) {
				xport = this.checker.getAliasedSymbol(xport);
			}
			//let type: ts.Type = this.checker.getDeclaredTypeOfSymbol(xport);
			
			this.rootExportedSymbols[xport.getName()] = xport.declarations[0];
		  });
	}
	
	emitDts() {
		for (var xport in this.rootExportedSymbols) {
			let decl = this.rootExportedSymbols[xport];
			console.log(xport, (<any>ts).SyntaxKind[decl.kind]);
			switch (decl.kind) {
				case ts.SyntaxKind.ClassDeclaration:
				  let clazz = <ts.ClassLikeDeclaration>decl;
				  if (clazz.heritageClauses) {
					clazz.heritageClauses.forEach((heritage: ts.HeritageClause) => 
						heritage.types.forEach((typeExpr) => {
							if (!this.rootExportedSymbols.hasOwnProperty(typeExpr.getText())) {
								throw new Error(xport + ' depends on unexported supertype ' + typeExpr.getText());
							}
						}));
				  }
				this.renderedDts += decl.getText();
			        break;
			}
		}
	}
}